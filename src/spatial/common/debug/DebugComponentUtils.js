import { useEffect } from "react";

import {
    createEntity,
    generateEntityUUID,
    removeEntity,
    setComponent,
    UUIDComponent,
} from "../../../ecs";
import { useHookstate } from "../../../hyperflux";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { ObjectLayerMaskComponent } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { setVisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayerMasks } from "../../../spatial/renderer/constants/ObjectLayers";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

export function useHelperEntity(
    entity,
    component,
    helper = undefined,
    layerMask = ObjectLayerMasks.NodeHelper,
) {
    const helperEntityState = useHookstate(createEntity);

    useEffect(() => {
        const helperEntity = helperEntityState.value;
        if (helper) {
            helper.name = `${component.name.value}-${entity}`;
            addObjectToGroup(helperEntity, helper);
            setComponent(helperEntity, NameComponent, helper.name);
        }
        setComponent(helperEntity, EntityTreeComponent, { parentEntity });
        setComponent(helperEntity, UUIDComponent, generateEntityUUID());
        setComponent(helperEntity, ObjectLayerMaskComponent, layerMask);
        setVisibleComponent(helperEntity, true);
        component.entity.set(helperEntity);

        return () => {
            removeEntity(helperEntity);
        };
    }, []);

    return helperEntityState.value;
}
