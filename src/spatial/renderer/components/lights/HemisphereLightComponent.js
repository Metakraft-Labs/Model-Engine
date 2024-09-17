import { useEffect } from "react";
import { Color, HemisphereLight } from "three";

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
import { RendererState } from "../../RendererState";
import { addObjectToGroup, removeObjectFromGroup } from "../GroupComponent";
import { LightTagComponent } from "./LightTagComponent";

export const HemisphereLightComponent = defineComponent({
    name: "HemisphereLightComponent",
    jsonID: "EE_hemisphere_light",

    onInit: _entity => {
        return {
            skyColor: new Color(),
            groundColor: new Color(),
            intensity: 1,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.skyColor) && json.skyColor.isColor)
            component.skyColor.set(json.skyColor);
        if (matches.string.test(json.skyColor) || matches.number.test(json.skyColor))
            component.skyColor.value.set(json.skyColor);
        if (matches.object.test(json.groundColor) && json.groundColor.isColor)
            component.groundColor.set(json.groundColor);
        if (matches.string.test(json.groundColor) || matches.number.test(json.groundColor))
            component.groundColor.value.set(json.groundColor);
        if (matches.number.test(json.intensity)) component.intensity.set(json.intensity);
    },

    toJSON: (entity, component) => {
        return {
            skyColor: component.skyColor.value,
            groundColor: component.groundColor.value,
            intensity: component.intensity.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const hemisphereLightComponent = useComponent(entity, HemisphereLightComponent);
        const renderState = useMutableState(RendererState);
        const debugEnabled = renderState.nodeHelperVisibility;
        const [light] = useDisposable(HemisphereLight, entity);
        const lightHelper = useOptionalComponent(entity, LightHelperComponent);

        useEffect(() => {
            setComponent(entity, LightTagComponent);
            addObjectToGroup(entity, light);
            return () => {
                removeObjectFromGroup(entity, light);
            };
        }, []);
        useEffect(() => {
            light.groundColor.set(hemisphereLightComponent.groundColor.value);
        }, [hemisphereLightComponent.groundColor]);

        useEffect(() => {
            light.color.set(hemisphereLightComponent.skyColor.value);
            if (lightHelper) lightHelper.color.set(hemisphereLightComponent.skyColor.value);
        }, [hemisphereLightComponent.skyColor]);

        useEffect(() => {
            light.intensity = hemisphereLightComponent.intensity.value;
        }, [hemisphereLightComponent.intensity]);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, LightHelperComponent, {
                    name: "hemisphere-light-helper",
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
