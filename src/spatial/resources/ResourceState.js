import { Cache, RepeatWrapping } from "three";

import { Engine, getOptionalComponent, UndefinedEntity } from "../../ecs";
import { defineState, getMutableState, getState, NO_PROXY, none } from "../../hyperflux";
import { removeObjectFromGroup } from "../../spatial/renderer/components/GroupComponent";

import iterateObject3D from "../common/functions/iterateObject3D";
import { PerformanceState } from "../renderer/PerformanceState";
import { RendererComponent } from "../renderer/WebGLRendererSystem";

Cache.enabled = true;

export const ResourceStatus = {
    Unloaded: "Unloaded",
    Loading: "Loading",
    Loaded: "Loaded",
    Error: "Error",
};
export const ResourceType = {
    GLTF: "GLTF",
    Mesh: "Mesh",
    Texture: "Texture",
    Geometry: "Geometry",
    Material: "Material",
    Object3D: "Object3D",
    Audio: "Audio",
    Unknown: "Unknown",
    // ECSData = 'ECSData',
};

export const ResourceState = defineState({
    name: "ResourceManagerState",

    initial: () => {
        Cache.clear();
        return {
            resources: {},
            totalVertexCount: 0,
            totalBufferCount: 0,
            debug: false,
        };
    },

    debugLog: (...data) => {
        if (getState(ResourceState).debug) console.log(...data);
    },
    debugWarn: (...data) => {
        if (getState(ResourceState).debug) console.warn(...data);
    },
});

//#region budget checking functions
const getTotalSizeOfResources = () => {
    let size = 0;
    const resources = getState(ResourceState).resources;
    for (const key in resources) {
        const resource = resources[key];
        if (resource.metadata.size) size += resource.metadata.size;
    }

    return size;
};

const getTotalBufferSize = () => {
    let size = 0;
    const resources = getState(ResourceState).resources;
    for (const key in resources) {
        const resource = resources[key];
        if (resource.type == ResourceType.Texture && resource.metadata.size)
            size += resource.metadata.size;
    }

    return size;
};

const getTotalVertexCount = () => {
    let verts = 0;
    const resources = getState(ResourceState).resources;
    for (const key in resources) {
        const resource = resources[key];
        if (resource.type == ResourceType.Geometry && resource.metadata.vertexCount)
            verts += resource.metadata.vertexCount;
    }

    return verts;
};

const getRendererInfo = () => {
    const viewer = Engine?.instance?.viewerEntity;
    if (!viewer) return {};
    const renderer = getOptionalComponent(viewer, RendererComponent)?.renderer;
    if (!renderer) return {};
    return {
        memory: renderer.info.memory,
        programCount: renderer.info.programs?.length,
    };
};

const checkBudgets = () => {
    const resourceState = getState(ResourceState);
    const performanceState = getState(PerformanceState);
    const maxVerts = performanceState.maxVerticies;
    const maxBuffer = performanceState.maxBufferSize;
    const currVerts = resourceState.totalVertexCount;
    const currBuff = resourceState.totalBufferCount;
    if (currVerts > maxVerts)
        console.warn(
            "ResourceState:GLTF:onLoad Exceeded vertex budget, budget: " +
                maxVerts +
                ", loaded: " +
                currVerts,
        );
    if (currBuff > maxBuffer)
        console.warn(
            "ResourceState:GLTF:onLoad Exceeded buffer budget, budget: " +
                maxBuffer +
                ", loaded: " +
                currBuff,
        );
};
//#endregion

//#region resource loading callbacks
const resourceCallbacks = {
    [ResourceType.GLTF]: {
        onStart: _resource => {},
        onLoad: (asset, resource, resourceState) => {
            const resources = getMutableState(ResourceState).nested("resources");
            const geometryIDs = resource.assetRefs[ResourceType.Geometry];
            const metadata = resource.metadata;
            if (geometryIDs && geometryIDs.value) {
                let vertexCount = 0;
                for (const geoID of geometryIDs.value) {
                    const geoResource = resources[geoID].value;
                    const verts = geoResource.metadata.vertexCount;
                    if (verts) vertexCount += verts;
                }
                metadata.merge({ vertexCount: vertexCount });
                resourceState.totalVertexCount.set(
                    resourceState.totalVertexCount.value + vertexCount,
                );
            }
            const textureIDs = resource.assetRefs[ResourceType.Texture];
            if (textureIDs && textureIDs.value) {
                const textureWidths = [];
                for (const textureID of textureIDs.value) {
                    const texResource = resources[textureID].value;
                    const textureWidth = texResource.metadata.textureWidth;
                    if (textureWidth) textureWidths.push(textureWidth);
                }
                metadata.textureWidths.set(textureWidths);
            }

            if (asset.parser) delete asset.parser;
        },
        onProgress: (request, resource) => {
            resource.metadata.size.set(request.total);
        },
        onError: (_event, _resource) => {},
        onUnload: (_asset, resource, resourceState) => {
            const metadata = resource.metadata.value;
            if (metadata.vertexCount)
                resourceState.totalVertexCount.set(
                    resourceState.totalVertexCount.value - metadata.vertexCount,
                );
        },
    },
    [ResourceType.Texture]: {
        onStart: resource => {
            resource.metadata.merge({ onGPU: false });
        },
        onLoad: (asset, resource, resourceState) => {
            asset.wrapS = RepeatWrapping;
            asset.wrapT = RepeatWrapping;
            asset.onUpdate = () => {
                if (resource && resource.value) resource.metadata.merge({ onGPU: true });
                //@ts-ignore
                asset.onUpdate = null;
            };
            //Compressed texture size
            if (asset.mipmaps[0]) {
                let size = 0;
                for (const mip of asset.mipmaps) {
                    size += mip.data.byteLength;
                }
                resource.metadata.size.set(size);
                // Non compressed texture size
            } else {
                const height = asset.image.height;
                const width = asset.image.width;
                const size = width * height * 4;
                resource.metadata.size.set(size);
            }

            if (asset.isCompressedTexture) {
                const id = resource.id.value;
                if (id.endsWith("ktx2")) asset.source.data.src = id;
            }

            resource.metadata.merge({ textureWidth: asset.image.width });
            resourceState.totalBufferCount.set(
                resourceState.totalBufferCount.value + resource.metadata.size.value,
            );
        },
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, resource, resourceState) => {
            asset.dispose();
            const size = resource.metadata.size.value;
            if (size)
                resourceState.totalBufferCount.set(resourceState.totalBufferCount.value - size);
        },
    },
    [ResourceType.Material]: {
        onStart: _resource => {},
        onLoad: (_asset, _resource, _resourceState) => {},
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, _resource, _resourceState) => {
            disposeMaterial(asset);
        },
    },
    [ResourceType.Geometry]: {
        onStart: _resource => {},
        onLoad: (asset, resource, _resourceState) => {
            // Estimated geometry size
            const attributeKeys = Object.keys(asset.attributes);
            let needsUploaded = asset.index ? attributeKeys.length + 1 : attributeKeys.length;
            let size = 0;

            const checkUploaded = () => {
                if (needsUploaded == 0 && resource && resource.value)
                    resource.metadata.merge({ onGPU: true });
            };

            asset.index?.onUpload(() => {
                needsUploaded -= 1;
                checkUploaded();
            });

            for (const name of attributeKeys) {
                const attr = asset.getAttribute(name);
                size += attr.count * attr.itemSize * attr.array?.BYTES_PER_ELEMENT;
                if (typeof attr.onUpload === "function") {
                    attr.onUpload(() => {
                        needsUploaded -= 1;
                        checkUploaded();
                    });
                } else {
                    needsUploaded -= 1;
                }
            }
            checkUploaded();

            const indices = asset.getIndex();
            if (indices) {
                resource.metadata.merge({ vertexCount: indices.count });
                size += indices.count * indices.itemSize * indices.array?.BYTES_PER_ELEMENT;
            }
            resource.metadata.size.set(size);
        },
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, _resource, _resourceState) => {
            disposeGeometry(asset);
        },
    },
    [ResourceType.Mesh]: {
        onStart: _resource => {},
        onLoad: (_asset, _resource, _resourceState) => {},
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, _resource, _resourceState) => {
            disposeMesh(asset);
        },
    },
    [ResourceType.Object3D]: {
        onStart: _resource => {},
        onLoad: (_asset, _resource, _resourceState) => {},
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, _resource, _resourceState) => {
            tryUnloadObj(asset);
        },
    },
    [ResourceType.Audio]: {
        onStart: _resource => {},
        onLoad: (_asset, _resource, _resourceState) => {},
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (_asset, _resource, _resourceState) => {},
    },
    [ResourceType.Unknown]: {
        onStart: _resource => {},
        onLoad: (_asset, _resource, _resourceState) => {},
        onProgress: (_request, _resource) => {},
        onError: (_event, _resource) => {},
        onUnload: (asset, _resource, _resourceState) => {
            dispose(asset);
        },
    },
};
//#endregion

//#region resource disposal functions
const dispose = asset => {
    if (asset.isBufferGeometry) disposeGeometry(asset);
    else if (asset.isMaterial) disposeMaterial(asset);
    else if (asset.isMesh) disposeMesh(asset);
    else {
        const disposable = asset;
        if (!disposable.disposed && typeof disposable.dispose == "function") disposable.dispose();
        disposable.disposed = true;
    }
};

const disposeGeometry = asset => {
    if (asset.disposed) return;
    asset.dispose();
    for (const key in asset.attributes) {
        asset.deleteAttribute(key);
    }
    for (const key in asset.morphAttributes) {
        delete asset.morphAttributes[key];
    }

    //@ts-ignore todo - figure out why check errors flags this
    if (asset.boundsTree) asset.disposeBoundsTree();
    asset.disposed = true;
};

const disposeMesh = asset => {
    if (asset.disposed) return;
    const skinnedMesh = asset;
    if (skinnedMesh.isSkinnedMesh && skinnedMesh.skeleton) {
        skinnedMesh.skeleton.dispose();
    }

    // InstancedMesh or anything with a dispose function
    const disposable = asset;
    if (typeof disposable.dispose === "function") {
        disposable.dispose();
    }
    asset.disposed = true;
};

const disposeMaterial = asset => {
    const dispose = material => {
        if (material.disposed) return;
        for (const [_, val] of Object.entries(material)) {
            if (val && val.isTexture) {
                unload(val.uuid, UndefinedEntity);
            }
        }
        material.dispose();
        material.disposed = true;
    };
    if (Array.isArray(asset)) {
        for (const mat of asset) dispose(mat);
    } else {
        dispose(asset);
    }
};

const disposeObj = (obj, sceneID) => {
    ResourceState.debugLog(
        `ResourceManager:unloadObj Unloading Object3D: ${obj.name} for scene: ${sceneID}`,
    );
    const disposable = obj; // anything with dispose function
    if (typeof disposable.dispose === "function") disposable.dispose();
};
//#endregion

const onItemLoadedFor = (url, resourceType, id, asset) => {
    const resourceState = getMutableState(ResourceState);
    const resources = resourceState.nested("resources");
    if (!resources[url].value) {
        // Volumetric models load assets that aren't managed by the resource manager
        // console.warn('ResourceManager:loadedFor asset loaded for asset that is not loaded: ' + url)
        return;
    }

    ResourceState.debugLog(
        `ResourceManager:loadedFor loading asset of type ${resourceType} with ID: ${id} for asset at url: ${url}`,
    );

    if (!resources[id].value) {
        resources.merge({
            [id]: {
                id: id,
                status: ResourceStatus.Loaded,
                type: resourceType,
                references: [],
                asset: asset,
                metadata: {},
            },
        });
        const callbacks = resourceCallbacks[resourceType];
        callbacks.onStart(resources[id]);
        callbacks.onLoad(asset, resources[id], resourceState);
    }

    const assetRefs = resources[url].assetRefs;
    if (!assetRefs || !assetRefs.value) assetRefs.set({ [resourceType]: [id] });
    else if (!assetRefs.value[resourceType]) assetRefs.merge({ [resourceType]: [id] });
    else {
        assetRefs[resourceType].set(refs => {
            if (!refs.includes(id)) refs.push(id);
            return refs;
        });
    }
};

const getResourceType = (asset, defaultType = ResourceType.Unknown) => {
    if (asset.isBufferGeometry) return ResourceType.Geometry;
    else if (asset.isMaterial) return ResourceType.Material;
    else if (asset.isMesh) return ResourceType.Mesh;
    else if (asset.isTexture) return ResourceType.Texture;
    else return defaultType;
};

const loadObj = (disposableLike, entity, ...args) => {
    const resourceState = getMutableState(ResourceState);
    const resources = resourceState.nested("resources");
    const obj = new disposableLike(...args);
    if (entity) obj.entity = entity;
    const id = obj.uuid;
    const resourceType = getResourceType(obj, ResourceType.Object3D);
    const callbacks = resourceCallbacks[resourceType];

    // Only one object can exist per UUID
    resources.merge({
        [id]: {
            id: id,
            asset: obj,
            status: ResourceStatus.Loaded,
            type: resourceType,
            references: [entity],
            metadata: {},
            onLoads: {},
        },
    });

    const resource = resources[id];
    callbacks.onStart(resource);
    callbacks.onLoad(obj, resource, resourceState);
    ResourceState.debugLog(
        "ResourceManager:loadObj Loading object resource: " + id + " for entity: " + entity,
    );
    return obj;
};

const addReferencedAsset = (assetKey, asset, resourceType = ResourceType.Unknown) => {
    if (resourceType == ResourceType.Unknown) resourceType = getResourceType(asset);

    switch (resourceType) {
        case ResourceType.GLTF:
            ResourceState.debugWarn(
                "ResourceState:addReferencedAsset GLTFs shouldn't be a referenced asset",
            );
            break;
        case ResourceType.Mesh: {
            const mesh = asset;
            onItemLoadedFor(assetKey, resourceType, asset.uuid, mesh);
            addReferencedAsset(assetKey, mesh.material, ResourceType.Material);
            addReferencedAsset(assetKey, mesh.geometry, ResourceType.Geometry);
            break;
        }
        case ResourceType.Texture:
            onItemLoadedFor(assetKey, resourceType, asset.uuid, asset);
            break;
        case ResourceType.Geometry:
            onItemLoadedFor(assetKey, resourceType, asset.uuid, asset);
            break;
        case ResourceType.Material: {
            const material = asset;
            onItemLoadedFor(assetKey, resourceType, material.uuid, material);
            for (const [_, val] of Object.entries(material)) {
                if (val && val.isTexture) {
                    addReferencedAsset(assetKey, val, ResourceType.Texture);
                }
            }
            break;
        }
        case ResourceType.Object3D:
            onItemLoadedFor(assetKey, resourceType, asset.uuid, asset);
            break;
        default:
            break;
    }
};

const addResource = (res, id, entity) => {
    const resourceState = getMutableState(ResourceState);
    const resources = resourceState.nested("resources");
    const obj = typeof res === "function" ? res() : res;
    const resourceType = getResourceType(obj);
    const callbacks = resourceCallbacks[resourceType];

    if (!resources[id].value) {
        resources.merge({
            [id]: {
                id: id,
                asset: obj,
                status: ResourceStatus.Loaded,
                type: resourceType,
                references: [entity],
                metadata: {},
                onLoads: {},
            },
        });
        const resource = resources[id];
        callbacks.onStart(resource);
        callbacks.onLoad(obj, resource, resourceState);
    } else {
        resources[id].references.merge([entity]);
    }

    ResourceState.debugLog(
        "ResourceManager:addResource Loading resource: " + id + " for entity: " + entity,
    );
    return resources[id].asset.get(NO_PROXY);
};

const unload = (id, entity, uuid) => {
    const resourceState = getMutableState(ResourceState);
    const resources = resourceState.nested("resources");
    if (!resources[id].value) {
        ResourceState.debugWarn("ResourceManager:unload No resource exists for id: " + id);
        return;
    }

    const resource = resources[id];
    ResourceState.debugLog(
        `ResourceManager:unload Unloading resource: ${id}, for entity: ${entity}, of type: ${resource.type.value}`,
    );
    if (uuid) resource.onLoads.merge({ [uuid]: none });
    resource.references.set(entities => {
        const index = entities.indexOf(entity);
        if (index > -1) {
            entities.splice(index, 1);
        }
        return entities;
    });

    if (resource.references.length == 0) {
        if (resourceState.debug.value)
            ResourceState.debugLog(
                "Before Removing Resources: " + JSON.stringify(getRendererInfo()),
            );
        removeResource(id);
        if (resourceState.debug.value)
            ResourceState.debugLog(
                "After Removing Resources: " + JSON.stringify(getRendererInfo()),
            );
    }
};

const tryUnloadObj = obj => {
    const obj3D = obj;
    if (!obj3D.isObject3D) return;

    const entity = obj.entity;
    if (entity) removeObjectFromGroup(entity, obj3D);
    unloadObj(obj3D);
};

const unloadObj = (obj, sceneID) => {
    if (obj.isProxified) {
        disposeObj(obj, sceneID);
    } else {
        iterateObject3D(obj, disposeObj);
    }
};

const removeResource = id => {
    const resourceState = getMutableState(ResourceState);
    const resources = resourceState.nested("resources");
    if (!resources[id].value) {
        ResourceState.debugWarn("ResourceManager:removeResource No resource exists at id: " + id);
        return;
    }

    const resource = resources[id];
    ResourceState.debugLog(
        "ResourceManager:removeResource: Removing " +
            resource.type.value +
            " resource with ID: " +
            id,
    );
    Cache.remove(id);

    const asset = resource.asset.get(NO_PROXY);
    if (asset) {
        resourceCallbacks[resource.type.value].onUnload(asset, resource, resourceState);
    }

    resources[id].set(none);
};

export const ResourceManager = {
    resourceCallbacks,
    loadObj,
    addReferencedAsset,
    addResource,
    unload,
    unloadObj,
    checkBudgets,
    budgets: {
        getTotalSizeOfResources,
        getTotalBufferSize,
        getTotalVertexCount,
    },
    /** Removes a resource even if it is still being referenced, needed for updating assets in the studio */
    __unsafeRemoveResource: removeResource,
};
