import { useLayoutEffect } from "react";
import { Color, MeshLambertMaterial, PlaneGeometry, ShadowMaterial } from "three";

import {
    defineComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { matches } from "../../../hyperflux";
import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { CollisionGroups } from "../../../spatial/physics/enums/CollisionGroups";
import { BodyTypes, Shapes } from "../../../spatial/physics/types/PhysicsTypes";
import { useMeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { ObjectLayerMaskComponent } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { ObjectLayerMasks } from "../../../spatial/renderer/constants/ObjectLayers";

export const GroundPlaneComponent = defineComponent({
    name: "GroundPlaneComponent",
    jsonID: "EE_ground_plane",

    onInit(_entity) {
        return {
            color: new Color(),
            visible: true,
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;

        if (
            matches.object.test(json.color) ||
            matches.string.test(json.color) ||
            matches.number.test(json.color)
        )
            component.color.value.set(json.color);
        if (matches.boolean.test(json.visible)) component.visible.set(json.visible);
    },

    toJSON(entity, component) {
        return {
            color: component.color.value,
            visible: component.visible.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();

        const component = useComponent(entity, GroundPlaneComponent);

        const getMaterial = () => {
            return component.visible.value
                ? new MeshLambertMaterial()
                : new ShadowMaterial({ opacity: 0.5 });
        };

        const mesh = useMeshComponent(entity, () => new PlaneGeometry(10000, 10000), getMaterial);

        useLayoutEffect(() => {
            const meshVal = mesh.value;
            meshVal.geometry.rotateX(-Math.PI / 2);
            meshVal.name = "GroundPlaneMesh";
            meshVal.material.polygonOffset = true;
            meshVal.material.polygonOffsetFactor = -0.01;
            meshVal.material.polygonOffsetUnits = 1;

            setComponent(entity, ObjectLayerMaskComponent, ObjectLayerMasks.Scene);
            setComponent(entity, RigidBodyComponent, { type: BodyTypes.Fixed });
            setComponent(entity, ColliderComponent, {
                shape: Shapes.Plane,
                collisionLayer: CollisionGroups.Ground,
                collisionMask: CollisionGroups.Default | CollisionGroups.Avatars,
            });
            return () => {
                removeComponent(entity, RigidBodyComponent);
                removeComponent(entity, ColliderComponent);
            };
        }, []);

        useLayoutEffect(() => {
            const color = component.color.value;
            if (mesh.material.color.value == color) return;
            mesh.material.color.set(component.color.value);
        }, [component.color]);

        useLayoutEffect(() => {
            const mat = getMaterial();
            mat.color.set(component.color.value);
            mesh.material.set(mat);
        }, [component.visible]);

        return null;
    },
});
