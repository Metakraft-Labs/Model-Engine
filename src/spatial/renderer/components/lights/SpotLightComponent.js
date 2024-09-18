import { useEffect } from "react";
import { Color, SpotLight } from "three";

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
import { useUpdateLight } from "../../functions/useUpdateLight";
import { RendererState } from "../../RendererState";
import { addObjectToGroup, removeObjectFromGroup } from "../GroupComponent";
import { LightTagComponent } from "./LightTagComponent";

// const ringGeom = new TorusGeometry(0.1, 0.025, 8, 12)
// const coneGeom = new ConeGeometry(0.25, 0.5, 8, 1, true)
// coneGeom.translate(0, -0.25, 0)
// coneGeom.rotateX(-Math.PI / 2)
// const geom = mergeBufferGeometries([ringGeom, coneGeom])
// const helperMaterial = new MeshBasicMaterial({ fog: false, transparent: true, opacity: 0.5, side: DoubleSide })

export const SpotLightComponent = defineComponent({
    name: "SpotLightComponent",
    jsonID: "EE_spot_light",

    onInit: _entity => {
        return {
            color: new Color(),
            intensity: 10,
            range: 0,
            decay: 2,
            angle: Math.PI / 3,
            penumbra: 1,
            castShadow: false,
            shadowBias: 0.00001,
            shadowRadius: 1,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.color) && json.color.isColor) component.color.set(json.color);
        if (matches.string.test(json.color) || matches.number.test(json.color))
            component.color.value.set(json.color);
        if (matches.number.test(json.intensity)) component.intensity.set(json.intensity);
        if (matches.number.test(json.range)) component.range.set(json.range);
        if (matches.number.test(json.decay)) component.decay.set(json.decay);
        if (matches.number.test(json.angle)) component.angle.set(json.angle);
        if (matches.number.test(json.penumbra)) component.penumbra.set(json.penumbra);
        if (matches.boolean.test(json.castShadow)) component.castShadow.set(json.castShadow);
        /** backwards compat */
        if (matches.number.test(json.shadowBias)) component.shadowBias.set(json.shadowBias);
        if (matches.number.test(json.shadowRadius)) component.shadowRadius.set(json.shadowRadius);
    },

    toJSON: (_entity, component) => {
        return {
            color: component.color.value,
            intensity: component.intensity.value,
            range: component.range.value,
            decay: component.decay.value,
            angle: component.angle.value,
            penumbra: component.penumbra.value,
            castShadow: component.castShadow.value,
            shadowBias: component.shadowBias.value,
            shadowRadius: component.shadowRadius.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const renderState = useMutableState(RendererState);
        const debugEnabled = renderState.nodeHelperVisibility;
        const spotLightComponent = useComponent(entity, SpotLightComponent);
        const [light] = useDisposable(SpotLight, entity);
        const lightHelper = useOptionalComponent(entity, LightHelperComponent);

        useEffect(() => {
            setComponent(entity, LightTagComponent);
            if (isMobileXRHeadset) return;
            light.target.position.set(1, 0, 0);
            light.target.name = "light-target";
            addObjectToGroup(entity, light);
            return () => {
                removeObjectFromGroup(entity, light);
            };
        }, []);

        useEffect(() => {
            light.color.set(spotLightComponent.color.value);
            if (lightHelper) lightHelper.color.set(spotLightComponent.color.value);
        }, [spotLightComponent.color, lightHelper]);

        useEffect(() => {
            light.intensity = spotLightComponent.intensity.value;
        }, [spotLightComponent.intensity]);

        useEffect(() => {
            light.distance = spotLightComponent.range.value;
        }, [spotLightComponent.range]);

        useEffect(() => {
            light.decay = spotLightComponent.decay.value;
        }, [spotLightComponent.decay]);

        useEffect(() => {
            light.angle = spotLightComponent.angle.value;
        }, [spotLightComponent.angle]);

        useEffect(() => {
            light.penumbra = spotLightComponent.penumbra.value;
        }, [spotLightComponent.penumbra]);

        useEffect(() => {
            light.shadow.bias = spotLightComponent.shadowBias.value;
        }, [spotLightComponent.shadowBias]);

        useEffect(() => {
            light.shadow.radius = spotLightComponent.shadowRadius.value;
        }, [spotLightComponent.shadowRadius]);

        useEffect(() => {
            light.castShadow = spotLightComponent.castShadow.value;
        }, [spotLightComponent.castShadow]);

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
                    name: "spot-light-helper",
                    light: light,
                });
            }
            return () => {
                removeComponent(entity, LightHelperComponent);
            };
        }, [debugEnabled]);

        useUpdateLight(light);

        return null;
    },
});
