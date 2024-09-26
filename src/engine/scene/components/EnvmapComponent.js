import React, { useEffect } from "react";
import {
    Color,
    CubeReflectionMapping,
    DataTexture,
    EquirectangularReflectionMapping,
    MeshMatcapMaterial,
    RGBAFormat,
    SRGBColorSpace,
    Uniform,
    Vector3,
} from "three";

import { UUIDComponent, useQuery } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getMutableComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { createDisposable } from "../../../spatial/resources/resourceHooks";

import {
    MaterialInstanceComponent,
    MaterialStateComponent,
} from "../../../spatial/renderer/materials/MaterialComponent";
import { setPlugin } from "../../../spatial/renderer/materials/materialFunctions";
import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import {
    envmapParsReplaceLambert,
    envmapPhysicalParsReplace,
    envmapReplaceLambert,
    worldposReplace,
} from "../classes/BPCEMShader";
import { EnvMapSourceType, EnvMapTextureType } from "../constants/EnvMapEnum";
import { getRGBArray, loadCubeMapTexture } from "../constants/Util";
import { addError, removeError } from "../functions/ErrorFunctions";
import { createReflectionProbeRenderTarget } from "../functions/reflectionProbeFunctions";
import { EnvMapBakeComponent } from "./EnvMapBakeComponent";
import { ReflectionProbeComponent } from "./ReflectionProbeComponent";

const tempColor = new Color();

export const EnvmapComponent = defineComponent({
    name: "EnvmapComponent",
    jsonID: "EE_envmap",
    onInit: _entity => {
        return {
            type: EnvMapSourceType.None,
            envMapTextureType: EnvMapTextureType.Equirectangular,
            envMapSourceColor: new Color(0xfff),
            envMapSourceURL: "",
            envMapSourceEntityUUID: "",
            envMapIntensity: 1,
            // internal
            envmap: null,
        };
    },

    onSet: (entity, component, json) => {
        if (typeof json?.type === "string") component.type.set(json.type);
        if (typeof json?.envMapTextureType === "string")
            component.envMapTextureType.set(json.envMapTextureType);
        if (typeof json?.envMapSourceColor === "number")
            component.envMapSourceColor.set(new Color(json.envMapSourceColor));
        if (typeof json?.envMapSourceURL === "string")
            component.envMapSourceURL.set(json.envMapSourceURL);
        if (typeof json?.envMapSourceEntityUUID === "string")
            component.envMapSourceEntityUUID.set(json.envMapSourceEntityUUID);
        if (typeof json?.envMapIntensity === "number")
            component.envMapIntensity.set(json.envMapIntensity);
    },

    toJSON: (entity, component) => {
        return {
            type: component.type.value,
            envMapTextureType: component.envMapTextureType.value,
            envMapSourceColor: component.envMapSourceColor.value,
            envMapSourceURL: component.envMapSourceURL.value,
            envMapSourceEntityUUID: component.envMapSourceEntityUUID.value,
            envMapIntensity: component.envMapIntensity.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();

        const component = useComponent(entity, EnvmapComponent);
        const mesh = useOptionalComponent(entity, MeshComponent)?.value;
        const [envMapTexture, error] = useTexture(
            component.envMapTextureType.value === EnvMapTextureType.Equirectangular
                ? component.envMapSourceURL.value
                : "",
            entity,
        );

        const probeQuery = useQuery([ReflectionProbeComponent]);

        useEffect(() => {
            updateEnvMapIntensity(mesh, component.envMapIntensity.value);
        }, [mesh, component.envMapIntensity]);

        useEffect(() => {
            if (component.type.value !== EnvMapSourceType.Skybox) return;
            component.envmap.set(null);
            /** Setting the value from the skybox can be found in EnvironmentSystem */
        }, [component.type]);

        useEffect(() => {
            if (component.type.value !== EnvMapSourceType.Color) return;

            const col = component.envMapSourceColor.value ?? tempColor;
            const resolution = 64; // Min value required
            const [texture, unload] = createDisposable(
                DataTexture,
                entity,
                getRGBArray(col),
                resolution,
                resolution,
                RGBAFormat,
            );
            texture.needsUpdate = true;
            texture.colorSpace = SRGBColorSpace;
            texture.mapping = EquirectangularReflectionMapping;
            component.envmap.set(texture);

            return () => {
                unload();
            };
        }, [component.type, component.envMapSourceColor]);

        useEffect(() => {
            if (component.type.value !== EnvMapSourceType.Probes) return;
            if (!probeQuery.length) return;
            const [renderTexture, unload] = createReflectionProbeRenderTarget(entity, probeQuery);
            component.envmap.set(renderTexture);
            return () => {
                unload();
                component.envmap.set(null);
            };
        }, [component.type, probeQuery.length]);

        useEffect(() => {
            if (!envMapTexture) return;

            envMapTexture.mapping = EquirectangularReflectionMapping;
            component.envmap.set(envMapTexture);
        }, [envMapTexture]);

        useEffect(() => {
            if (!error) return;

            component.envmap.set(null);
            addError(entity, EnvmapComponent, "MISSING_FILE", "Skybox texture could not be found!");
        }, [error]);

        useEffect(() => {
            if (component.type.value !== EnvMapSourceType.Texture) return;

            if (component.envMapTextureType.value == EnvMapTextureType.Cubemap) {
                loadCubeMapTexture(
                    component.envMapSourceURL.value,
                    texture => {
                        if (texture) {
                            texture.mapping = CubeReflectionMapping;
                            texture.colorSpace = SRGBColorSpace;
                            component.envmap.set(texture);
                            removeError(entity, EnvmapComponent, "MISSING_FILE");
                        }
                    },
                    undefined,
                    _ => {
                        component.envmap.set(null);
                        addError(
                            entity,
                            EnvmapComponent,
                            "MISSING_FILE",
                            "Skybox texture could not be found!",
                        );
                    },
                );
            }
        }, [component.type, component.envMapSourceURL]);

        useEffect(() => {
            //if (!component.envmap.value) return
            updateEnvMap(mesh, component.envmap.value);
        }, [mesh, component.envmap]);

        useEffect(() => {
            const envmap = component.envmap.value;
            if (!envmap) return;

            return () => {
                envmap.dispose();
            };
        }, [component.envmap]);

        const bakeEntity = UUIDComponent.getEntityByUUID(component.envMapSourceEntityUUID.value);

        if (component.type.value !== EnvMapSourceType.Bake) return null;

        return (
            <EnvBakeComponentReactor
                key={bakeEntity}
                envmapEntity={entity}
                bakeEntity={bakeEntity}
            />
        );
    },

    errors: ["MISSING_FILE"],
});

const EnvBakeComponentReactor = props => {
    const { envmapEntity, bakeEntity } = props;
    const bakeComponent = useComponent(bakeEntity, EnvMapBakeComponent);
    const group = useComponent(envmapEntity, GroupComponent);
    const uuid = useComponent(envmapEntity, MaterialInstanceComponent).uuid;
    const [envMaptexture, error] = useTexture(bakeComponent.envMapOrigin.value, envmapEntity);
    useEffect(() => {
        const texture = envMaptexture;
        if (!texture) return;
        texture.mapping = EquirectangularReflectionMapping;
        getMutableComponent(envmapEntity, EnvmapComponent).envmap.set(texture);
        if (bakeComponent.boxProjection.value) applyBoxProjection(bakeEntity, group.value);
    }, [envMaptexture, uuid]);

    useEffect(() => {
        if (!error) return;
        addError(
            envmapEntity,
            EnvmapComponent,
            "MISSING_FILE",
            "Skybox texture could not be found!",
        );
    }, [error]);

    return null;
};

export function updateEnvMap(obj, envmap) {
    if (!obj) return;
    if (!obj.material) return;
    if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => {
            if (mat instanceof MeshMatcapMaterial) return;
            mat.envMap = envmap;
            mat.needsUpdate = true;
        });
    } else {
        if (obj.material instanceof MeshMatcapMaterial) return;
        const material = obj.material;
        material.envMap = envmap;
        material.needsUpdate = true;
    }
}

export const updateEnvMapIntensity = (obj, intensity) => {
    if (!obj) return;
    if (!obj.material) return;
    if (Array.isArray(obj.material)) {
        obj.material.forEach(m => {
            m.envMapIntensity = intensity;
        });
    } else {
        obj.material.envMapIntensity = intensity;
    }
};

export const BoxProjectionPlugin = defineComponent({
    name: "BoxProjectionPlugin",
    onInit: entity => {
        return {
            cubeMapSize: new Uniform(new Vector3()),
            cubeMapPos: new Uniform(new Vector3()),
        };
    },
    onSet: (entity, component, json) => {
        if (json?.cubeMapSize) component.cubeMapSize.set(json.cubeMapSize);
        if (json?.cubeMapPos) component.cubeMapPos.set(json.cubeMapPos);
    },
    reactor: () => {
        const entity = useEntityContext();

        useEffect(() => {
            const materialComponent = getComponent(entity, MaterialStateComponent);

            const callback = (shader, renderer) => {
                const plugin = getComponent(entity, BoxProjectionPlugin);

                shader.uniforms.cubeMapSize = plugin.cubeMapSize;
                shader.uniforms.cubeMapPos = plugin.cubeMapPos;

                const shaderType = shader.shaderType;
                const isPhysical =
                    shaderType === "MeshStandardMaterial" || shaderType === "MeshPhysicalMaterial";
                const isSupported =
                    isPhysical ||
                    shaderType === "MeshLambertMaterial" ||
                    shaderType === "MeshPhongMaterial";
                if (!isSupported) return;

                if (isPhysical) {
                    if (!shader.vertexShader.startsWith("varying vec3 vWorldPosition"))
                        shader.vertexShader =
                            "varying vec3 vWorldPosition;\n" + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        "#include <worldpos_vertex>",
                        worldposReplace,
                    );
                    shader.fragmentShader = shader.fragmentShader.replace(
                        "#include <envmap_physical_pars_fragment>",
                        envmapPhysicalParsReplace,
                    );
                } else {
                    shader.fragmentShader = shader.fragmentShader.replace(
                        "#include <envmap_pars_fragment>",
                        envmapParsReplaceLambert,
                    );
                    shader.fragmentShader = shader.fragmentShader.replace(
                        "#include <envmap_fragment>",
                        envmapReplaceLambert,
                    );
                }
            };

            setPlugin(materialComponent.material, callback);
        });
    },
});

const applyBoxProjection = (entity, targets) => {
    const bakeComponent = getComponent(entity, EnvMapBakeComponent);
    for (const target of targets) {
        const child = target;
        if (!child.material || child.type == "VFXBatch") return;

        const materialEntity = UUIDComponent.getEntityByUUID(child.material.uuid);
        setComponent(materialEntity, BoxProjectionPlugin, {
            cubeMapPos: new Uniform(bakeComponent.bakePositionOffset),
            cubeMapSize: new Uniform(bakeComponent.bakeScale),
        });
    }
};
