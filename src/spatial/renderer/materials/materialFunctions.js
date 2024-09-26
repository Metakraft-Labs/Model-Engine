import { isArray } from "lodash";
import { Color } from "three";

import {
    createEntity,
    generateEntityUUID,
    getComponent,
    getMutableComponent,
    getOptionalComponent,
    hasComponent,
    removeEntity,
    setComponent,
    UndefinedEntity,
    UUIDComponent,
} from "../../../ecs";

import { AssetLoaderState } from "../../../engine/assets/state/AssetLoaderState";
import { getState } from "../../../hyperflux";
import iterateObject3D from "../../common/functions/iterateObject3D";
import { NameComponent } from "../../common/NameComponent";
import { MeshComponent } from "../components/MeshComponent";
import {
    MaterialInstanceComponent,
    MaterialPlugins,
    MaterialPrototypeComponent,
    MaterialStateComponent,
    prototypeQuery,
} from "./MaterialComponent";

export const loadMaterialGLTF = (url, callback) => {
    const gltfLoader = getState(AssetLoaderState).gltfLoader;
    gltfLoader.load(url, gltf => {
        const material = iterateObject3D(
            gltf.scene,
            mesh => mesh.material,
            mesh => mesh?.isMesh,
        )[0];
        if (!material) callback(null);
        callback(material);
    });
};

export const extractDefaults = defaultArgs => {
    return formatMaterialArgs(
        Object.fromEntries(Object.entries(defaultArgs).map(([k, v]) => [k, v.default])),
        defaultArgs,
    );
};

export const formatMaterialArgs = (args, defaultArgs = undefined) => {
    if (!args) return args;
    return Object.fromEntries(
        Object.entries(args)
            .map(([k, v]) => {
                if (!!defaultArgs && defaultArgs[k]) {
                    switch (defaultArgs[k].type) {
                        case "color":
                            return [k, v ? (v.isColor ? v : new Color(v)) : undefined];
                    }
                }
                const tex = v;
                if (tex?.isTexture) {
                    if (tex.source.data !== undefined) {
                        return [k, v];
                    }
                    return [k, undefined];
                }
                if (v === "") return [k, undefined];
                return [k, v];
            })
            .filter(([_, v]) => v !== undefined),
    );
};

export const createMaterialPrototype = prototype => {
    const prototypeEntity = createEntity();
    const prototypeObject = {};
    prototypeObject[prototype.prototypeId] = prototype.prototypeConstructor;
    setComponent(prototypeEntity, MaterialPrototypeComponent, {
        prototypeConstructor: prototypeObject,
        prototypeArguments: prototype.arguments,
    });
    setComponent(prototypeEntity, NameComponent, prototype.prototypeId);
    setComponent(prototypeEntity, UUIDComponent, generateEntityUUID());
};

export const getMaterial = uuid => {
    return (
        getOptionalComponent(UUIDComponent.getEntityByUUID(uuid), MaterialStateComponent)
            ?.material ??
        getComponent(
            UUIDComponent.getEntityByUUID(MaterialStateComponent.fallbackMaterial),
            MaterialStateComponent,
        ).material
    );
};

export const setMeshMaterial = (groupEntity, newMaterialUUIDs = []) => {
    const mesh = getComponent(groupEntity, MeshComponent);
    if (!isArray(mesh.material)) mesh.material = getMaterial(newMaterialUUIDs[0]);
    else
        for (let i = 0; i < mesh.material.length; i++)
            mesh.material[i] = getMaterial(newMaterialUUIDs[i]);
};

export const setPlugin = (material, callback) => {
    if (hasPlugin(material, callback)) removePlugin(material, callback);
    material.onBeforeCompile = callback;
    material.needsUpdate = true;
};

export const hasPlugin = (material, callback) =>
    material.plugins?.length &&
    !!material.plugins.find(plugin => plugin.toString() === callback.toString());

export const removePlugin = (material, callback) => {
    const pluginIndex = material.plugins?.findIndex(plugin => plugin === callback);
    if (pluginIndex !== undefined) material.plugins?.splice(pluginIndex, 1);
};

export const materialPrototypeMatches = materialEntity => {
    const materialComponent = getComponent(materialEntity, MaterialStateComponent);
    const prototypeEntity = materialComponent.prototypeEntity;
    if (!prototypeEntity) return false;
    const prototypeComponent = getComponent(prototypeEntity, MaterialPrototypeComponent);
    const prototypeName = Object.keys(prototypeComponent.prototypeConstructor)[0];
    const material = materialComponent.material;
    const materialType = material.userData.type || material.type;
    return materialType === prototypeName;
};

/**Updates the material entity's threejs material prototype to match its
 * current prototype entity */
export const updateMaterialPrototype = materialEntity => {
    const materialComponent = getComponent(materialEntity, MaterialStateComponent);
    const prototypeEntity = materialComponent.prototypeEntity;
    const prototypeName = getComponent(prototypeEntity, NameComponent);
    const prototypeComponent = getComponent(prototypeEntity, MaterialPrototypeComponent);
    const prototypeConstructor = prototypeComponent.prototypeConstructor[prototypeName];
    if (!prototypeConstructor || !prototypeComponent.prototypeArguments) return;
    const material = materialComponent.material;
    if (!material || material.type === prototypeName) return;
    const fullParameters = { ...extractDefaults(prototypeComponent.prototypeArguments) };
    const newMaterial = new prototypeConstructor(fullParameters);
    if (newMaterial.plugins) {
        newMaterial.customProgramCacheKey = () =>
            (newMaterial.shader
                ? newMaterial.shader.fragmentShader + newMaterial.shader.vertexShader
                : "") +
            newMaterial.plugins.map(plugin => plugin?.toString() ?? "").reduce((x, y) => x + y, "");
    }
    newMaterial.uuid = material.uuid;
    if (material.defines?.["USE_COLOR"]) {
        newMaterial.defines = newMaterial.defines ?? {};
        newMaterial.defines["USE_COLOR"] = material.defines["USE_COLOR"];
    }
    newMaterial.userData = {
        ...newMaterial.userData,
        ...Object.fromEntries(Object.entries(material.userData).filter(([k]) => k !== "type")),
    };
    setComponent(materialEntity, MaterialStateComponent, {
        material: newMaterial,
        parameters: fullParameters,
    });

    return newMaterial;
};

export function MaterialNotFoundError(message) {
    this.name = "MaterialNotFound";
    this.message = message;
}

export function PrototypeNotFoundError(message) {
    this.name = "PrototypeNotFound";
    this.message = message;
}

/** Assigns a preexisting material entity to a mesh */
export const assignMaterial = (user, materialEntity, index = 0) => {
    const materialStateComponent = getMutableComponent(materialEntity, MaterialStateComponent);
    materialStateComponent?.instances.set([...materialStateComponent.instances.value, user]);
    if (!user) return;
    if (!hasComponent(user, MaterialInstanceComponent))
        setComponent(user, MaterialInstanceComponent);
    const material = materialStateComponent.material.value;
    const materialInstanceComponent = getMutableComponent(user, MaterialInstanceComponent);
    const newUUID = material.uuid;
    if (!UUIDComponent.getEntityByUUID(newUUID))
        throw new MaterialNotFoundError(`Material ${newUUID} not found`);
    materialInstanceComponent.uuid[index].set(newUUID);
};

/**Sets and replaces a material entity for a material's UUID */
export const createMaterialEntity = material => {
    const materialEntity = createEntity();
    const uuid = material.uuid;
    const existingMaterial = UUIDComponent.getEntityByUUID(uuid);
    const existingUsers = existingMaterial
        ? getComponent(existingMaterial, MaterialStateComponent).instances
        : [];
    if (existingMaterial) {
        removeEntity(existingMaterial);
    }
    setComponent(materialEntity, UUIDComponent, material.uuid);
    const prototypeEntity = getPrototypeEntityFromName(material.userData.type || material.type);
    if (!prototypeEntity) {
        console.warn(
            `Material ${material.name} has no prototype entity for prototype ${material.userData.type || material.type}`,
        );
        return UndefinedEntity;
    }
    setComponent(materialEntity, MaterialStateComponent, {
        material,
        prototypeEntity,
        parameters: Object.fromEntries(
            Object.keys(
                extractDefaults(
                    getComponent(prototypeEntity, MaterialPrototypeComponent).prototypeArguments,
                ),
            ).map(k => [k, material[k]]),
        ),
        instances: existingUsers.length ? existingUsers : [],
    });
    if (existingMaterial)
        for (const instance of existingUsers)
            setMeshMaterial(instance, getComponent(instance, MaterialInstanceComponent).uuid);
    if (material.userData?.plugins)
        material.userData.plugins.map(plugin => {
            if (!plugin) return;
            setComponent(materialEntity, MaterialPlugins[plugin.id]);
            const pluginComponent = getComponent(materialEntity, MaterialPlugins[plugin.id]);
            for (const [k, v] of Object.entries(plugin.uniforms)) {
                if (v) pluginComponent[k].value = v;
            }
        });
    setComponent(
        materialEntity,
        NameComponent,
        material.name === "" ? material.type : material.name,
    );
    return materialEntity;
};

export const createAndAssignMaterial = (user, material, index = 0) => {
    const materialEntity = createMaterialEntity(material);
    assignMaterial(user, materialEntity, index);
    return materialEntity;
};

export const getMaterialIndices = (entity, materialUUID) => {
    const uuids = getComponent(entity, MaterialInstanceComponent).uuid;
    return uuids
        .map((uuid, index) => (uuid === materialUUID ? index : undefined))
        .filter(x => x !== undefined);
};

export const getPrototypeEntityFromName = name =>
    prototypeQuery().find(entity => getComponent(entity, NameComponent) === name);

export const injectMaterialDefaults = materialUUID => {
    const material = getOptionalComponent(
        UUIDComponent.getEntityByUUID(materialUUID),
        MaterialStateComponent,
    );
    if (!material?.prototypeEntity) return;
    const prototype = getComponent(
        material.prototypeEntity,
        MaterialPrototypeComponent,
    ).prototypeArguments;
    if (!prototype) return;
    return Object.fromEntries(
        Object.entries(prototype).map(([k, v]) => [k, { ...v, default: material.parameters[k] }]),
    );
};
