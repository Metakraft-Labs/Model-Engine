import { useEffect } from "react";
import { BufferGeometry, Color, DirectionalLight, Float32BufferAttribute } from "three";

import {
    defineComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../../ecs/EntityFunctions";
import { matches, useMutableState } from "../../../../hyperflux";

import { mergeBufferGeometries } from "../../../common/classes/BufferGeometryUtils";
import { useDisposable } from "../../../resources/resourceHooks";
import { useUpdateLight } from "../../functions/useUpdateLight";
import { RendererState } from "../../RendererState";
import { addObjectToGroup, removeObjectFromGroup } from "../GroupComponent";
import { LineSegmentComponent } from "../LineSegmentComponent";
import { LightTagComponent } from "./LightTagComponent";

const size = 1;
const lightPlaneGeometry = new BufferGeometry();
lightPlaneGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(
        [
            -size,
            size,
            0,
            size,
            size,
            0,
            size,
            size,
            0,
            size,
            -size,
            0,
            size,
            -size,
            0,
            -size,
            -size,
            0,
            -size,
            -size,
            0,
            -size,
            size,
            0,
            -size,
            size,
            0,
            size,
            -size,
            0,
            size,
            size,
            0,
            -size,
            -size,
            0,
        ],
        3,
    ),
);

const targetLineGeometry = new BufferGeometry();
const t = size * 0.1;
targetLineGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(
        [-t, t, 0, 0, 0, 1, t, t, 0, 0, 0, 1, t, -t, 0, 0, 0, 1, -t, -t, 0, 0, 0, 1],
        3,
    ),
);

const mergedGeometry = mergeBufferGeometries([targetLineGeometry, lightPlaneGeometry]);

export const DirectionalLightComponent = defineComponent({
    name: "DirectionalLightComponent",
    jsonID: "EE_directional_light",

    onInit: _entity => {
        return {
            light: null,
            color: new Color(),
            intensity: 1,
            castShadow: false,
            shadowBias: -0.00001,
            shadowRadius: 1,
            cameraFar: 200,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.color) && json.color.isColor) component.color.set(json.color);
        if (matches.string.test(json.color) || matches.number.test(json.color))
            component.color.value.set(json.color);
        if (matches.number.test(json.intensity)) component.intensity.set(json.intensity);
        if (matches.number.test(json.cameraFar)) component.cameraFar.set(json.cameraFar);
        if (matches.boolean.test(json.castShadow)) component.castShadow.set(json.castShadow);
        /** backwards compat */
        if (matches.number.test(json.shadowBias)) component.shadowBias.set(json.shadowBias);
        if (matches.number.test(json.shadowRadius)) component.shadowRadius.set(json.shadowRadius);
    },

    toJSON: (_entity, component) => {
        return {
            color: component.color.value,
            intensity: component.intensity.value,
            cameraFar: component.cameraFar.value,
            castShadow: component.castShadow.value,
            shadowBias: component.shadowBias.value,
            shadowRadius: component.shadowRadius.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const renderState = useMutableState(RendererState);
        const debugEnabled = renderState.nodeHelperVisibility;
        const directionalLightComponent = useComponent(entity, DirectionalLightComponent);
        const [light] = useDisposable(DirectionalLight, entity);
        const lightHelper = useOptionalComponent(entity, LineSegmentComponent);

        useEffect(() => {
            setComponent(entity, LightTagComponent);
            directionalLightComponent.light.set(light);
            addObjectToGroup(entity, light);
            return () => {
                removeObjectFromGroup(entity, light);
            };
        }, []);

        useEffect(() => {
            light.color.set(directionalLightComponent.color.value);
            if (!lightHelper) return;
            lightHelper.color.set(directionalLightComponent.color.value);
        }, [directionalLightComponent.color]);

        useEffect(() => {
            light.intensity = directionalLightComponent.intensity.value;
        }, [directionalLightComponent.intensity]);

        useEffect(() => {
            light.shadow.camera.far = directionalLightComponent.cameraFar.value;
            light.shadow.camera.updateProjectionMatrix();
        }, [directionalLightComponent.cameraFar]);

        useEffect(() => {
            light.shadow.bias = directionalLightComponent.shadowBias.value;
        }, [directionalLightComponent.shadowBias]);

        useEffect(() => {
            light.shadow.radius = directionalLightComponent.shadowRadius.value;
        }, [directionalLightComponent.shadowRadius]);

        useEffect(() => {
            if (light.shadow.mapSize.x !== renderState.shadowMapResolution.value) {
                light.shadow.mapSize.setScalar(renderState.shadowMapResolution.value);
                light.shadow.map?.dispose();
                light.shadow.map = null;
                light.shadow.camera.updateProjectionMatrix();
                light.shadow.needsUpdate = true;
            }
        }, [renderState.shadowMapResolution]);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, LineSegmentComponent, {
                    name: "directional-light-helper",
                    // Clone geometry because LineSegmentComponent disposes it when removed
                    geometry: mergedGeometry?.clone(),
                    color: directionalLightComponent.color.value,
                });
            }

            return () => {
                removeComponent(entity, LineSegmentComponent);
            };
        }, [debugEnabled]);

        useUpdateLight(light);

        return null;
    },
});
