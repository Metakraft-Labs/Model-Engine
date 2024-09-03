import { useEffect } from "react";
import { Box3, Box3Helper } from "three";

import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    hasComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { createEntity, removeEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, matches, useHookstate } from "../../../hyperflux";
import {
    EntityTreeComponent,
    iterateEntityNode,
} from "../../../spatial/transform/components/EntityTree";

import { NameComponent } from "../../common/NameComponent";
import { addObjectToGroup, GroupComponent } from "../../renderer/components/GroupComponent";
import { MeshComponent } from "../../renderer/components/MeshComponent";
import { setObjectLayers } from "../../renderer/components/ObjectLayerComponent";
import { VisibleComponent } from "../../renderer/components/VisibleComponent";
import { ObjectLayers } from "../../renderer/constants/ObjectLayers";
import { RendererState } from "../../renderer/RendererState";

export const BoundingBoxComponent = defineComponent({
    name: "BoundingBoxComponent",

    onInit: entity => {
        return {
            box: new Box3(),
            helper: UndefinedEntity,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.box)) component.box.value.copy(json.box);
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const boundingBox = useComponent(entity, BoundingBoxComponent);

        useEffect(() => {
            updateBoundingBox(entity);

            if (!debugEnabled.value) return;

            const helperEntity = createEntity();

            const helper = new Box3Helper(boundingBox.box.value);
            helper.name = `bounding-box-helper-${entity}`;

            setComponent(helperEntity, NameComponent, helper.name);
            setComponent(helperEntity, VisibleComponent);

            setComponent(helperEntity, EntityTreeComponent, { parentEntity: entity });

            addObjectToGroup(helperEntity, helper);
            setObjectLayers(helper, ObjectLayers.NodeHelper);
            boundingBox.helper.set(helperEntity);

            return () => {
                removeEntity(helperEntity);
                if (!hasComponent(entity, BoundingBoxComponent)) return;
                boundingBox.helper.set(UndefinedEntity);
            };
        }, [debugEnabled]);

        return null;
    },
});

export const updateBoundingBox = entity => {
    const boxComponent = getOptionalComponent(entity, BoundingBoxComponent);

    if (!boxComponent) {
        console.error("BoundingBoxComponent not found in updateBoundingBox");
        return;
    }

    const box = boxComponent.box;
    box.makeEmpty();

    const callback = child => {
        const obj = getOptionalComponent(child, MeshComponent);
        if (obj) expandBoxByObject(obj, box);
    };

    iterateEntityNode(entity, callback);

    /** helper has custom logic in updateMatrixWorld */
    const boundingBox = getComponent(entity, BoundingBoxComponent);
    const helperEntity = boundingBox.helper;
    if (!helperEntity) return;

    const helperObject = getComponent(helperEntity, GroupComponent)?.[0];
    helperObject.updateMatrixWorld(true);
};

const _box = new Box3();

const expandBoxByObject = (object, box) => {
    const geometry = object.geometry;

    if (geometry) {
        if (geometry.boundingBox === null) {
            geometry.computeBoundingBox();
        }

        _box.copy(geometry.boundingBox);
        _box.applyMatrix4(object.matrixWorld);
        box.union(_box);
    }
};
