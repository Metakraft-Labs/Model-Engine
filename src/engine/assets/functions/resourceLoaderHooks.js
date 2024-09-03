import { useEffect } from "react";
import { Texture } from "three";
import { v4 as uuidv4 } from "uuid";

import { UndefinedEntity } from "../../../ecs";
import { NO_PROXY, useHookstate, useImmediateEffect } from "../../../hyperflux";
import { ResourceManager, ResourceType } from "../../../spatial/resources/ResourceState";

import { ResourcePendingComponent } from "../../gltf/ResourcePendingComponent";
import { loadResource } from "./resourceLoaderFunctions";

function useLoader(
    url,
    resourceType,
    entity = UndefinedEntity,
    //Called when the asset url is changed, mostly useful for editor functions when changing an asset
    onUnload = url => {},
) {
    const value = useHookstate < T > null;
    const error = (useHookstate < ErrorEvent) | (Error > null);
    const progress = useHookstate < ProgressEvent < EventTarget >> null;
    const uuid = useHookstate < string > uuidv4;

    const unload = () => {
        if (url) ResourceManager.unload(url, entity, uuid.value);
    };

    useEffect(() => {
        return unload;
    }, []);

    useImmediateEffect(() => {
        const _url = url;
        if (!_url) return;
        let completed = false;

        if (entity) {
            ResourcePendingComponent.setResource(entity, _url, 0, 0);
        }

        const controller = new AbortController();
        loadResource(
            _url,
            resourceType,
            entity,
            response => {
                completed = true;
                value.set(response);
                if (entity) {
                    ResourcePendingComponent.removeResource(entity, _url);
                }
            },
            request => {
                progress.set(request);
                if (entity) {
                    ResourcePendingComponent.setResource(
                        entity,
                        _url,
                        request.loaded,
                        request.total,
                    );
                }
            },
            err => {
                // Effect was unmounted, can't set error state safely
                if (controller.signal.aborted) return;
                completed = true;
                error.set(err);
                if (entity) {
                    ResourcePendingComponent.removeResource(entity, _url);
                }
            },
            controller.signal,
            uuid.value,
        );

        return () => {
            if (!completed)
                controller.abort(
                    `resourceHooks:useLoader Component loading ${resourceType} at url ${url} for entity ${entity} was unmounted`,
                );

            ResourceManager.unload(_url, entity, uuid.value);
            value.set(null);
            progress.set(null);
            error.set(null);
            onUnload(_url);
        };
    }, [url]);

    return [value.get(NO_PROXY), error.get(NO_PROXY), progress.get(NO_PROXY), unload];
}

function useBatchLoader(urls, resourceType, entity = UndefinedEntity) {
    const values = useHookstate(new Array(urls.length).fill(null));
    const errors = useHookstate(new Array(urls.length).fill(null));
    const progress = useHookstate(new Array(urls.length).fill(null));

    const unload = () => {
        for (const url of urls) ResourceManager.unload(url, entity);
    };

    useEffect(() => {
        return unload;
    }, []);

    useImmediateEffect(() => {
        const completedArr = new Array(urls.length).fill(false);
        const controller = new AbortController();

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            if (!url) continue;
            loadResource(
                url,
                resourceType,
                entity,
                response => {
                    completedArr[i] = true;
                    values[i].set(response);
                },
                request => {
                    progress[i].set(request);
                },
                err => {
                    completedArr[i] = true;
                    errors[i].set(err);
                },
                controller.signal,
            );
        }

        return () => {
            for (const completed of completedArr) {
                if (!completed) {
                    controller.abort(
                        `resourceHooks:useBatchLoader Component loading ${resourceType} at urls ${urls.toString()} for entity ${entity} was unmounted`,
                    );
                    return;
                }
            }
        };
    }, [JSON.stringify(urls)]);

    return [values, errors, progress, unload];
}

async function getLoader(url, resourceType, entity = UndefinedEntity) {
    const unload = () => {
        ResourceManager.unload(url, entity);
    };

    return new Promise(resolve => {
        const controller = new AbortController();
        loadResource(
            url,
            resourceType,
            entity,
            response => {
                resolve([response, unload, null]);
            },
            request => {},
            err => {
                resolve([null, unload, err]);
            },
            controller.signal,
        );
    });
}

/**
 *
 * GLTF loader hook for use in React Contexts.
 * The asset will be loaded through the ResourceManager in ResourceState.ts.
 * The asset will be unloaded and disposed when the component is unmounted or when onUnloadCallback is called.
 *
 * @param url The URL of the GLTF file to load
 * @param entity *Optional* The entity that is loading the GLTF, defaults to UndefinedEntity
 * @param params *Optional* LoadingArgs that are passed through to the asset loader
 * @param onUnload *Optional* A callback that is called when the URL is changed and the previous asset is unloaded, only needed for editor specific behavior
 * @returns Tuple of [GLTF, Error, Progress, onUnloadCallback]
 */
export function useGLTF(url, entity, onUnload) {
    return useLoader < GLTFAsset > (url, ResourceType.GLTF, entity, onUnload);
}

export function useGLTFDocument(url, entity, onUnload) {
    return useLoader < any > (url, ResourceType.Unknown, entity, onUnload);
}

/**
 *
 * Same as useGLTF hook, but takes an array of urls.
 * Only use in cases where you can operate idempotently on the result as changes to array elements are inherently non-reactive
 * Array values are returned wrapped in State to preserve the little reactivity there is
 * The assets will be unloaded and disposed when the component is unmounted or when onUnloadCallback is called.
 *
 * @param urls Array of GLTF URLs to load
 * @param entity *Optional* The entity that is loading the GLTF, defaults to UndefinedEntity
 * @param params *Optional* LoadingArgs that are passed through to the asset loader
 * @returns Tuple of [State<GLTF[]>, State<Error[]>, State<Progress[]>, onUnloadCallback]
 */
export function useBatchGLTF(urls, entity) {
    return useBatchLoader < GLTFAsset > (urls, ResourceType.GLTF, entity);
}

/**
 *
 * GLTF loader function for when you need to load an asset in a non-React context.
 * The asset will be loaded through the ResourceManager in ResourceState.ts.
 * The asset will only be unloaded when onUnloadCallback is called, otherwise the asset will be leaked.
 *
 * @param url The URL of the GLTF file to load
 * @param entity *Optional* The entity that is loading the GLTF, defaults to UndefinedEntity
 * @param params *Optional* LoadingArgs that are passed through to the asset loader
 * @returns Promise of Tuple of [GLTF, onUnloadCallback, Error]
 */
export async function getGLTFAsync(url, entity) {
    return getLoader < GLTFAsset > (url, ResourceType.GLTF, entity);
}

/**
 *
 * Texture loader hook for use in React Contexts.
 * The asset will be loaded through the ResourceManager in ResourceState.ts.
 * The asset will be unloaded and disposed when the component is unmounted or when onUnloadCallback is called.
 *
 * @param url The URL of the texture file to load
 * @param entity *Optional* The entity that is loading the texture, defaults to UndefinedEntity
 * @param params *Optional* LoadingArgs that are passed through to the asset loader
 * @param onUnload *Optional* A callback that is called when the URL is changed and the previous asset is unloaded, only needed for editor specific behavior
 * @returns Tuple of [Texture, Error, Progress, onUnloadCallback]
 */
export function useTexture(url, entity, onUnload) {
    return useLoader < Texture > (url, ResourceType.Texture, entity, onUnload);
}

/**
 *
 * Texture loader function for when you need to load an asset in a non-React context.
 * The asset will be loaded through the ResourceManager in ResourceState.ts.
 * The asset will only be unloaded when onUnloadCallback is called, otherwise the asset will be leaked.
 *
 * @param url The URL of the texture file to load
 * @param entity *Optional* The entity that is loading the texture, defaults to UndefinedEntity
 * @param params *Optional* LoadingArgs that are passed through to the asset loader
 * @returns Promise of Tuple of [Texture, onUnloadCallback, Error]
 */
export async function getTextureAsync(url, entity) {
    return getLoader < Texture > (url, ResourceType.Texture, entity);
}

export async function getAudioAsync(url, entity) {
    return getLoader < AudioBuffer > (url, ResourceType.Audio, entity);
}
