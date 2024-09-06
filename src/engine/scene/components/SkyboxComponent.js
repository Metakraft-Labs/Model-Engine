import { useEffect } from "react";
import {
    Color,
    CubeReflectionMapping,
    EquirectangularReflectionMapping,
    SRGBColorSpace,
} from "three";

import { Engine } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { BackgroundComponent } from "../../../spatial/renderer/components/SceneComponents";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";

import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import { Sky } from "../classes/Sky";
import { loadCubeMapTexture } from "../constants/Util";
import { addError, removeError } from "../functions/ErrorFunctions";

export const SkyboxComponent = defineComponent({
    name: "SkyboxComponent",

    jsonID: "EE_skybox",

    onInit: entity => {
        return {
            backgroundColor: new Color(0x000000),
            equirectangularPath: "",
            cubemapPath: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/skyboxsun25deg/`,
            backgroundType: 1,
            sky: null,
            skyboxProps: {
                turbidity: 10,
                rayleigh: 1,
                luminance: 1,
                mieCoefficient: 0.004999999999999893,
                mieDirectionalG: 0.99,
                inclination: 0.10471975511965978,
                azimuth: 0.16666666666666666,
            },
        };
    },

    onSet: (entity, component, json) => {
        if (typeof json?.backgroundColor === "number")
            component.backgroundColor.set(new Color(json.backgroundColor));
        if (typeof json?.equirectangularPath === "string")
            component.equirectangularPath.set(json.equirectangularPath);
        if (typeof json?.cubemapPath === "string") component.cubemapPath.set(json.cubemapPath);
        if (typeof json?.backgroundType === "number")
            component.backgroundType.set(json.backgroundType);
        if (typeof json?.skyboxProps === "object") component.skyboxProps.set(json.skyboxProps);
    },

    toJSON: (entity, component) => {
        return {
            backgroundColor: component.backgroundColor.value,
            equirectangularPath: component.equirectangularPath.value,
            cubemapPath: component.cubemapPath.value,
            backgroundType: component.backgroundType.value,
            skyboxProps: component.skyboxProps.get({ noproxy: true }),
        };
    },

    /** @todo remove this wil proper useEffect cleanups, after resource reworking callbacks */
    onRemove: (entity, component) => {
        removeComponent(entity, BackgroundComponent);
    },

    reactor: function () {
        const entity = useEntityContext();

        const skyboxState = useComponent(entity, SkyboxComponent);

        const [texture, error] = useTexture(skyboxState.equirectangularPath.value, entity);

        useEffect(() => {
            if (skyboxState.backgroundType.value !== "equirectangular") return;

            if (texture) {
                texture.colorSpace = SRGBColorSpace;
                texture.mapping = EquirectangularReflectionMapping;
                setComponent(entity, BackgroundComponent, texture);
                removeError(entity, SkyboxComponent, "FILE_ERROR");
            } else if (error) {
                addError(entity, SkyboxComponent, "FILE_ERROR", error.message);
            }
        }, [texture, error, skyboxState.backgroundType, skyboxState.equirectangularPath]);

        useEffect(() => {
            if (skyboxState.backgroundType.value !== "color") return;
            setComponent(entity, BackgroundComponent, skyboxState.backgroundColor.value);
        }, [skyboxState.backgroundType, skyboxState.backgroundColor]);

        useEffect(() => {
            if (skyboxState.backgroundType.value !== "cubemap") return;
            const onLoad = texture => {
                texture.colorSpace = SRGBColorSpace;
                texture.mapping = CubeReflectionMapping;
                setComponent(entity, BackgroundComponent, texture);
                removeError(entity, SkyboxComponent, "FILE_ERROR");
            };
            const loadArgs = [
                skyboxState.cubemapPath.value,
                onLoad,
                undefined,
                error => addError(entity, SkyboxComponent, "FILE_ERROR", error.message),
            ];
            /** @todo replace this with useCubemap */
            loadCubeMapTexture(...loadArgs);
        }, [skyboxState.backgroundType, skyboxState.cubemapPath]);

        useEffect(() => {
            if (skyboxState.backgroundType.value !== "skybox") {
                if (skyboxState.sky.value) skyboxState.sky.set(null);
                return;
            }

            skyboxState.sky.set(new Sky());

            const sky = skyboxState.sky.value;

            sky.azimuth = skyboxState.skyboxProps.value.azimuth;
            sky.inclination = skyboxState.skyboxProps.value.inclination;

            sky.mieCoefficient = skyboxState.skyboxProps.value.mieCoefficient;
            sky.mieDirectionalG = skyboxState.skyboxProps.value.mieDirectionalG;
            sky.rayleigh = skyboxState.skyboxProps.value.rayleigh;
            sky.turbidity = skyboxState.skyboxProps.value.turbidity;
            sky.luminance = skyboxState.skyboxProps.value.luminance;

            const renderer = getComponent(Engine.instance.viewerEntity, RendererComponent);

            const texture = sky.generateSkyboxTextureCube(renderer.renderer);
            texture.mapping = CubeReflectionMapping;

            setComponent(entity, BackgroundComponent, texture);
            sky.dispose();
        }, [
            skyboxState.backgroundType,
            skyboxState.skyboxProps,
            skyboxState.skyboxProps.azimuth,
            skyboxState.skyboxProps.inclination,
            skyboxState.skyboxProps.mieCoefficient,
            skyboxState.skyboxProps.mieDirectionalG,
            skyboxState.skyboxProps.rayleigh,
            skyboxState.skyboxProps.turbidity,
            skyboxState.skyboxProps.luminance,
        ]);

        return null;
    },

    errors: ["FILE_ERROR"],
});
