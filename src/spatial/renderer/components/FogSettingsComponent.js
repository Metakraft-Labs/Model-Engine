import { useEffect } from "react";
import { Fog, FogExp2 } from "three";

import {
    defineComponent,
    getOptionalComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { FogComponent } from "../../../spatial/renderer/components/SceneComponents";

import { FogShaders } from "../FogSystem";
import { initBrownianMotionFogShader, initHeightFogShader, removeFogShader } from "./FogShaders";

export const FogType = {
    Disabled: "disabled",
    Linear: "linear",
    Exponential: "exponential",
    Brownian: "brownian",
    Height: "height",
};

export const FogSettingsComponent = defineComponent({
    name: "FogSettingsComponent",
    jsonID: "EE_fog",

    onInit(_entity) {
        return {
            type: FogType.Disabled,
            color: "#FFFFFF",
            density: 0.005,
            near: 1,
            far: 1000,
            timeScale: 1,
            height: 0.05,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (typeof json.type === "string") component.type.set(json.type);
        if (typeof json.color === "string") component.color.set(json.color);
        if (typeof json.density === "number") component.density.set(json.density);
        if (typeof json.near === "number") component.near.set(json.near);
        if (typeof json.far === "number") component.far.set(json.far);
        if (typeof json.timeScale === "number") component.timeScale.set(json.timeScale);
        if (typeof json.height === "number") component.height.set(json.height);
    },

    toJSON: (entity, component) => {
        return {
            type: component.type.value,
            color: component.color.value,
            density: component.density.value,
            near: component.near.value,
            far: component.far.value,
            timeScale: component.timeScale.value,
            height: component.height.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const fog = useComponent(entity, FogSettingsComponent);

        useEffect(() => {
            const fogData = fog.value;
            switch (fogData.type) {
                case FogType.Linear:
                    setComponent(
                        entity,
                        FogComponent,
                        new Fog(fogData.color, fogData.near, fogData.far),
                    );
                    removeFogShader();
                    break;

                case FogType.Exponential:
                    setComponent(entity, FogComponent, new FogExp2(fogData.color, fogData.density));
                    removeFogShader();
                    break;

                case FogType.Brownian:
                    setComponent(entity, FogComponent, new FogExp2(fogData.color, fogData.density));
                    initBrownianMotionFogShader();
                    break;

                case FogType.Height:
                    setComponent(entity, FogComponent, new FogExp2(fogData.color, fogData.density));
                    initHeightFogShader();
                    break;

                default:
                    removeComponent(entity, FogComponent);
                    removeFogShader();
                    break;
            }
        }, [fog.type]);

        useEffect(() => {
            getOptionalComponent(entity, FogComponent)?.color.set(fog.color.value);
        }, [fog.color]);

        useEffect(() => {
            const fogComponent = getOptionalComponent(entity, FogComponent);
            if (fogComponent && fog.type.value !== FogType.Linear)
                fogComponent.density = fog.density.value;
        }, [fog.density]);

        useEffect(() => {
            const fogComponent = getOptionalComponent(entity, FogComponent);
            if (fogComponent) fogComponent.near = fog.near.value;
        }, [fog.near]);

        useEffect(() => {
            const fogComponent = getOptionalComponent(entity, FogComponent);
            if (fogComponent) fogComponent.far = fog.far.value;
        }, [fog.far]);

        useEffect(() => {
            const fogComponent = getOptionalComponent(entity, FogComponent);
            if (
                fogComponent &&
                (fog.type.value === FogType.Brownian || fog.type.value === FogType.Height)
            )
                for (const s of FogShaders) s.uniforms.heightFactor.value = fog.height.value;
        }, [fog.height]);

        useEffect(() => {
            const fogComponent = getOptionalComponent(entity, FogComponent);
            if (fogComponent && fog.type.value === FogType.Brownian)
                for (const s of FogShaders) {
                    s.uniforms.fogTimeScale.value = fog.timeScale.value;
                }
        }, [fog.timeScale]);

        return null;
    },
});
