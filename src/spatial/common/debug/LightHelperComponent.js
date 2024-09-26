import { useEffect } from "react";
import {
    DirectionalLightHelper,
    HemisphereLightHelper,
    PointLightHelper,
    SpotLightHelper,
} from "three";

import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { matchesColor } from "../../../spatial/common/functions/MatchesUtils";

import { useDisposable } from "../../resources/resourceHooks";
import { useHelperEntity } from "./DebugComponentUtils";

const getLightHelperType = light => {
    if (light.isDirectionalLight) return DirectionalLightHelper;
    else if (light.isSpotLight) return SpotLightHelper;
    else if (light.isHemisphereLight) return HemisphereLightHelper;
    else return PointLightHelper;
};

export const LightHelperComponent = defineComponent({
    name: "LightHelperComponent",

    onInit: _entity => {
        return {
            name: "light-helper",
            light: undefined,
            size: 1,
            color: undefined,
            entity: undefined,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (!json.light || !json.light.isLight)
            throw new Error("LightHelperComponent: Valid Light required");
        component.light.set(json.light);
        if (typeof json.name === "string") component.name.set(json.name);
        if (typeof json.size === "number") component.size.set(json.size);
        if (matchesColor.test(json.color)) component.color.set(json.color);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, LightHelperComponent);
        const light = component.light.value;
        const [helper] = useDisposable(
            getLightHelperType(light),
            entity,
            light,
            component.size.value,
        );
        useHelperEntity(entity, component, helper);
        helper.update();

        useEffect(() => {
            helper.color = component.color.value;
            helper.update();
        }, [component.color]);

        return null;
    },
});
