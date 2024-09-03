import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { UndefinedEntity } from "../../ecs";
import { useDidMount } from "../../hooks/useDidMount";
import { NO_PROXY, useHookstate } from "../../hyperflux";

import { ResourceManager } from "./ResourceState";

/**
 *
 * Loader hook for creating an instance of a class that implements the DisposableObject interface in ResourceState.ts in a React context,
 * but has it's lifecycle managed by the ResourceManager in ResourceState.ts
 *
 * @param disposableLike A class that implements the DisposableObject interface eg. DirectionalLight
 * @param entity *Optional* the entity that is loading the object
 * @param args *Optional* arguments to pass to the constructor of disposableLike
 * @returns A unique instance of the class that is passed in for DisposableObject
 */
export function useDisposable(disposableLike, entity, ...args) {
    const classState = useHookstate(() => disposableLike);
    const objState = useHookstate(() => ResourceManager.loadObj(disposableLike, entity, ...args));

    const unload = () => {
        if (objState.value) {
            ResourceManager.unload(objState.get(NO_PROXY).uuid, entity);
        }
    };

    useEffect(() => {
        return unload;
    }, []);

    useEffect(() => {
        if (disposableLike !== classState.value) {
            unload();
            classState.set(() => disposableLike);
            objState.set(() => ResourceManager.loadObj(disposableLike, entity, ...args));
        }
    }, [disposableLike]);

    return [objState.get(NO_PROXY), unload];
}

/**
 *
 * Loader hook for creating an instance of a class that extends DisposableObject in a non-React context,
 * Tracked by the ResourceManager in ResourceState.ts, but will not be unloaded unless the unload function that is returned is called
 * Useful for when you only want to create the object if a condition is met (eg. is debug enabled)
 *
 * @param disposableLike A class that implements the DisposableObject interface in ResourceState.ts eg. DirectionalLight
 * @param entity *Optional* the entity that is loading the object
 * @param args *Optional* arguments to pass to the constructor of k
 * @returns A unique instance of the class that is passed in for object3D and a callback to unload the object
 */
export function createDisposable(disposableLike, entity, ...args) {
    const obj = ResourceManager.loadObj(disposableLike, entity, ...args);

    const unload = () => {
        ResourceManager.unload(obj.uuid, entity);
    };

    return [obj, unload];
}

/**
 *
 * Hook to add any resource to be tracked by the resource manager
 * If the resource has a cleanup method that isn't called 'dispose', you'll need to pass in a callback function for onUnload to manage the cleanup
 *
 * @param resource the resource to track
 * @param entity *Optional* the entity that is loading the object
 * @param id *Optional* a unique id to track the resource with, a UUID will be created if an id is not provided
 * @param onUnload *Optional* a callback called when the resource is unloaded
 * @returns the resource object passed in
 */
export function useResource(resource, entity = UndefinedEntity, id, onUnload) {
    const uniqueID = useHookstate(id || uuidv4());
    const resourceState = useHookstate(() =>
        ResourceManager.addResource(resource, uniqueID.value, entity),
    );

    const unload = () => {
        ResourceManager.unload(uniqueID.value, entity);
        if (onUnload) onUnload();
    };

    useEffect(() => {
        return () => {
            unload();
        };
    }, []);

    useDidMount(() => {
        unload();
        ResourceManager.addResource(resourceState.value, uniqueID.value, entity);
    }, [resourceState]);

    return [resourceState, unload];
}
