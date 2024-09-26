import { useEffect } from "react";
import { Color, PointLight } from "three";

import {
    defineComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../../ecs/EntityFunctions";
import { matches, useMutableState } from "../../../../hyperflux";

import { LightHelperComponent } from "../../../common/debug/LightHelperComponent";
import { useDisposable } from "../../../resources/resourceHooks";
import { isMobileXRHeadset } from "../../../xr/XRState";
import { RendererState } from "../../RendererState";
import { addObjectToGroup, removeObjectFromGroup } from "../GroupComponent";
import { LightTagComponent } from "./LightTagComponent";

export const PointLightComponent = defineComponent({
    name: "PointLightComponent",
    jsonID: "EE_point_light",

    onInit: entity => {
        return {
            color: new Color(),
            intensity: 1,
            range: 0,
            decay: 2,
            castShadow: false,
            shadowBias: 0.5,
            shadowRadius: 1,
            helperEntity: null,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.color) && json.color.isColor) component.color.set(json.color);
        if (matches.string.test(json.color) || matches.number.test(json.color))
            component.color.value.set(json.color);
        if (matches.number.test(json.intensity)) component.intensity.set(json.intensity);
        if (matches.number.test(json.range)) component.range.set(json.range);
        if (matches.number.test(json.decay)) component.decay.set(json.decay);
        if (matches.boolean.test(json.castShadow)) component.castShadow.set(json.castShadow);
        /** backwards compat */
        if (matches.number.test(json.shadowBias)) component.shadowBias.set(json.shadowBias);
        if (matches.number.test(json.shadowRadius)) component.shadowRadius.set(json.shadowRadius);
    },

    toJSON: (entity, component) => {
        return {
            color: component.color.value,
            intensity: component.intensity.value,
            range: component.range.value,
            decay: component.decay.value,
            castShadow: component.castShadow.value,
            shadowBias: component.shadowBias.value,
            shadowRadius: component.shadowRadius.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const renderState = useMutableState(RendererState);
        const debugEnabled = renderState.nodeHelperVisibility;
        const pointLightComponent = useComponent(entity, PointLightComponent);
        const [light] = useDisposable(PointLight, entity);
        const lightHelper = useOptionalComponent(entity, LightHelperComponent);

        useEffect(() => {
            setComponent(entity, LightTagComponent);
            if (isMobileXRHeadset) return;
            addObjectToGroup(entity, light);
            return () => {
                removeObjectFromGroup(entity, light);
            };
        }, []);

        useEffect(() => {
            light.color.set(pointLightComponent.color.value);
            if (lightHelper) lightHelper.color.set(pointLightComponent.color.value);
        }, [pointLightComponent.color]);

        useEffect(() => {
            light.intensity = pointLightComponent.intensity.value;
        }, [pointLightComponent.intensity]);

        useEffect(() => {
            light.distance = pointLightComponent.range.value;
        }, [pointLightComponent.range]);

        useEffect(() => {
            light.decay = pointLightComponent.decay.value;
        }, [pointLightComponent.decay]);

        useEffect(() => {
            light.castShadow = pointLightComponent.castShadow.value;
        }, [pointLightComponent.castShadow]);

        useEffect(() => {
            light.shadow.bias = pointLightComponent.shadowBias.value;
        }, [pointLightComponent.shadowBias]);

        useEffect(() => {
            light.shadow.radius = pointLightComponent.shadowRadius.value;
        }, [pointLightComponent.shadowRadius]);

        useEffect(() => {
            if (light.shadow.mapSize.x !== renderState.shadowMapResolution.value) {
                light.shadow.mapSize.set(
                    renderState.shadowMapResolution.value,
                    renderState.shadowMapResolution.value,
                );
                light.shadow.map?.dispose();
                light.shadow.map = null;
                light.shadow.camera.updateProjectionMatrix();
                light.shadow.needsUpdate = true;
            }
        }, [renderState.shadowMapResolution]);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, LightHelperComponent, {
                    name: "pointlight-helper",
                    light: light,
                });
            }
            return () => {
                removeComponent(entity, LightHelperComponent);
            };
        }, [debugEnabled]);

        return null;
    },
});
