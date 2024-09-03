import { UUIDComponent } from "../../../../ecs";
import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    useOptionalComponent,
} from "../../../../ecs/ComponentFunctions";
import { MeshComponent } from "../../../../spatial/renderer/components/MeshComponent";
import { iterateEntityNode } from "../../../../spatial/transform/components/EntityTree";

import { ModelComponent } from "../../components/ModelComponent";

export function getModelSceneID(entity) {
    if (!hasComponent(entity, ModelComponent) || !hasComponent(entity, UUIDComponent)) {
        return "";
    }
    return getComponent(entity, UUIDComponent) + "-" + getComponent(entity, ModelComponent).src;
}

export function useModelSceneID(entity) {
    const uuid = useOptionalComponent(entity, UUIDComponent)?.value;
    const model = useOptionalComponent(entity, ModelComponent)?.value;
    if (!uuid || !model) return "";
    return uuid + "-" + model.src;
}

export function getModelResources(entity, defaultParms) {
    const model = getOptionalComponent(entity, ModelComponent);
    if (!model?.scene) return { geometries: [], images: [] };
    const geometries = iterateEntityNode(entity, entity => {
        if (!hasComponent(entity, MeshComponent)) return [];
        const mesh = getOptionalComponent(entity, MeshComponent);
        if (!mesh?.isMesh || !mesh.geometry) return [];
        mesh.name && (mesh.geometry.name = mesh.name);
        return [mesh.geometry];
    })
        .flatMap(x => x)
        .map(geometry => {
            const dracoParms = {
                quantizePosition: 14,
                quantizeNormal: 10,
                quantizeTexcoord: 12,
                quantizeColor: 8,
                quantizeGeneric: 12,
            };
            return {
                resourceId: geometry.uuid,
                isParameterOverride: true,
                enabled: true,
                parameters: {
                    weld: {
                        isParameterOverride: true,
                        enabled: false,
                        parameters: 0.0001,
                    },
                    dracoCompression: {
                        isParameterOverride: true,
                        enabled: false,
                        parameters: dracoParms,
                    },
                },
            };
        })
        .filter((x, i, arr) => arr.indexOf(x) === i); // remove duplicates

    const visitedMaterials = new Set();
    const images = iterateEntityNode(entity, entity => {
        const mesh = getOptionalComponent(entity, MeshComponent);
        if (!mesh?.isMesh || !mesh.material || visitedMaterials.has(mesh.material)) return [];
        visitedMaterials.add(mesh.material);
        const textures = Object.entries(mesh.material)
            .filter(([, x]) => x?.isTexture)
            .map(([field, texture]) => {
                texture.name = texture.name ? texture.name : `${mesh.material.name}-${field}`;
                return texture;
            });
        const tmpImages = textures.map(texture => texture.image);
        const images = textures
            .filter((texture, i, arr) => tmpImages.indexOf(tmpImages[i]) === i)
            .map(texture => {
                const image = texture.image;
                image.id = texture.name;
                let descriptor = "";
                if (/normal/i.test(texture.name)) {
                    descriptor = "normalMap";
                }
                if (/base[-_\s]*color/i.test(texture.name) || /diffuse/i.test(texture.name)) {
                    descriptor = "baseColorMap";
                }
                return [image, descriptor];
            });
        const result = images.map(([image, descriptor]) => {
            const imageParms = {
                resourceId: image.id,
                isParameterOverride: true,
                enabled: !!descriptor,
                parameters: {
                    flipY: {
                        enabled: false,
                        isParameterOverride: true,
                        parameters: false,
                    },
                    maxTextureSize: {
                        enabled: false,
                        isParameterOverride: true,
                        parameters: 1024,
                    },
                    textureFormat: {
                        enabled: false,
                        isParameterOverride: true,
                        parameters: "ktx2",
                    },
                    textureCompressionType: {
                        enabled: false,
                        isParameterOverride: true,
                        parameters: "etc1",
                    },
                    textureCompressionQuality: {
                        enabled: false,
                        isParameterOverride: true,
                        parameters: 128,
                    },
                },
            };
            if (descriptor === "normalMap") {
                imageParms.parameters.textureCompressionType.enabled = true;
                imageParms.parameters.textureCompressionType.parameters = "uastc";
            }
            if (descriptor === "baseColorMap") {
                imageParms.parameters.maxTextureSize.enabled = true;
                imageParms.parameters.maxTextureSize.parameters = defaultParms.maxTextureSize * 2;
            }
            return imageParms;
        });
        return result;
    })
        .flatMap(x => x)
        .filter((x, i, arr) => arr.indexOf(x) === i); // remove duplicates
    return {
        geometries,
        images,
    };
}
