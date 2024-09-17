import { useEffect } from "react";
import { AmbientLight, Color } from "three";

import { defineComponent, setComponent, useComponent } from "../../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../../ecs/EntityFunctions";
import { matches } from "../../../../hyperflux";

import { useDisposable } from "../../../resources/resourceHooks";
import { addObjectToGroup, removeObjectFromGroup } from "../GroupComponent";
import { LightTagComponent } from "./LightTagComponent";

export const AmbientLightComponent = defineComponent({
    name: "AmbientLightComponent",
    jsonID: "EE_ambient_light",

    onInit: _entity => {
        return {
            // todo, maybe we want to reference light.color instead of creating a new Color?
            color: new Color(),
            intensity: 1,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.color) && json.color.isColor) component.color.set(json.color);
        if (matches.string.test(json.color)) component.color.value.set(json.color);
        if (matches.number.test(json.intensity)) component.intensity.set(json.intensity);
    },

    toJSON: (entity, component) => {
        return {
            color: component.color.value,
            intensity: component.intensity.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const ambientLightComponent = useComponent(entity, AmbientLightComponent);
        const [light] = useDisposable(AmbientLight, entity);

        useEffect(() => {
            setComponent(entity, LightTagComponent);
            addObjectToGroup(entity, light);
            return () => {
                removeObjectFromGroup(entity, light);
            };
        }, []);

        useEffect(() => {
            light.color.set(ambientLightComponent.color.value);
        }, [ambientLightComponent.color]);

        useEffect(() => {
            light.intensity = ambientLightComponent.intensity.value;
        }, [ambientLightComponent.intensity]);

        return null;
    },
});
