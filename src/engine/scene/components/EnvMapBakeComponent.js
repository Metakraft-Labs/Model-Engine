import { useLayoutEffect } from "react";
import { MeshPhysicalMaterial, SphereGeometry, Vector3 } from "three";

import { defineComponent, removeComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, matches, useHookstate } from "../../../hyperflux";
import { DebugMeshComponent } from "../../../spatial/common/debug/DebugMeshComponent";
import { RendererState } from "../../../spatial/renderer/RendererState";

const sphereGeometry = new SphereGeometry(0.75);
const helperMeshMaterial = new MeshPhysicalMaterial({ roughness: 0, metalness: 1 });

export const EnvMapBakeComponent = defineComponent({
    name: "EnvMapBakeComponent",
    jsonID: "EE_envmapbake",

    onInit: entity => {
        return {
            bakePosition: new Vector3(),
            bakePositionOffset: new Vector3(),
            bakeScale: new Vector3().set(1, 1, 1),
            bakeType: "Baked",
            resolution: 1024,
            refreshMode: "OnAwake",
            envMapOrigin: "",
            boxProjection: true,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.bakePosition))
            component.bakePosition.value.copy(json.bakePosition);
        if (matches.object.test(json.bakePositionOffset))
            component.bakePositionOffset.value.copy(json.bakePositionOffset);
        if (matches.object.test(json.bakeScale)) component.bakeScale.value.copy(json.bakeScale);
        if (matches.string.test(json.bakeType)) component.bakeType.set(json.bakeType);
        if (matches.number.test(json.resolution)) component.resolution.set(json.resolution);
        if (matches.string.test(json.refreshMode)) component.refreshMode.set(json.refreshMode);
        if (matches.string.test(json.envMapOrigin)) component.envMapOrigin.set(json.envMapOrigin);
        if (matches.boolean.test(json.boxProjection))
            component.boxProjection.set(json.boxProjection);
    },

    toJSON: (entity, component) => {
        return {
            bakePosition: component.bakePosition.value,
            bakePositionOffset: component.bakePositionOffset.value,
            bakeScale: component.bakeScale.value,
            bakeType: component.bakeType.value,
            resolution: component.resolution.value,
            refreshMode: component.refreshMode.value,
            envMapOrigin: component.envMapOrigin.value,
            boxProjection: component.boxProjection.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);

        useLayoutEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, DebugMeshComponent, {
                    name: "envmap-bake-helper",
                    geometry: sphereGeometry,
                    material: helperMeshMaterial,
                });
            }

            return () => {
                removeComponent(entity, DebugMeshComponent);
            };
        }, [debugEnabled]);

        return null;
    },
});
