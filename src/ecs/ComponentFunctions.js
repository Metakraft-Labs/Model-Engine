import * as bitECS from "bitecs";
import React, { startTransition } from "react";
import { getNestedObject } from "../common/src/utils/getNestedProperty";
import { HyperFlux, startReactor } from "../hyperflux";
import { hookstate, NO_PROXY_STEALTH, none, useHookstate } from "../hyperflux/StateFunctions";

import { UndefinedEntity } from "./Entity";
import { EntityContext } from "./EntityFunctions";
import { defineQuery } from "./QueryFunctions";

/**
 * @description
 * Initial Max amount of entries that buffers for a Component type will contain.
 * - `100_000` for 'test' client environment
 * - `5_000` otherwise
 */
export const INITIAL_COMPONENT_SIZE =
    process.env.NODE_ENV === "development"
        ? 100000
        : 5000; /** @todo set to 0 after next bitECS update */
bitECS.setDefaultSize(INITIAL_COMPONENT_SIZE); // Send the INITIAL_COMPONENT_SIZE value to bitECS as its DefaultSize

export const ComponentMap = new Map();
export const ComponentJSONIDMap = new Map(); // <jsonID, Component>
globalThis.ComponentMap = ComponentMap;
globalThis.ComponentJSONIDMap = ComponentJSONIDMap;

export const defineComponent = def => {
    const Component = def.schema ? bitECS.defineComponent(def.schema, INITIAL_COMPONENT_SIZE) : {};
    Component.isComponent = true;
    Component.onInit = _entity => true;
    Component.onSet = (_entity, _component, _json) => {};
    Component.onRemove = () => {};
    Component.toJSON = (_entity, _component) => null;

    Component.errors = [];
    Object.assign(Component, def);
    if (Component.reactor)
        Object.defineProperty(Component.reactor, "name", {
            value: `Internal${Component.name}Reactor`,
        });
    Component.reactorMap = new Map();
    // We have to create an stateful existence map in order to reactively track which entities have a given component.
    // Unfortunately, we can't simply use a single shared state because hookstate will (incorrectly) invalidate other nested states when a single component
    // instance is added/removed, so each component instance has to be isolated from the others.
    Component.stateMap = {};
    if (Component.jsonID) {
        ComponentJSONIDMap.set(Component.jsonID, Component);
        console.log(`Registered component ${Component.name} with jsonID ${Component.jsonID}`);
    } else if (def.toJSON) {
        console.warn(
            `Component ${Component.name} has toJson defined, but no jsonID defined. This will cause serialization issues.`,
        );
    }
    ComponentMap.set(Component.name, Component);

    return Component;
};

export const getOptionalMutableComponent = (entity, component) => {
    if (!component?.stateMap[entity]) component.stateMap[entity] = hookstate(none);
    const componentState = component?.stateMap[entity];
    return componentState.promised ? undefined : componentState;
};

export const getMutableComponent = (entity, component) => {
    const componentState = getOptionalMutableComponent(entity, component);
    if (!componentState || componentState.promised) {
        console.warn(
            `[getMutableComponent] ${entity} does not have ${component.name}. This will be an error in the future. Use getOptionalMutableComponent if there is uncertainty over whether or not an entity has the specified component.`,
        );
        return undefined;
    }
    return componentState;
};

export const getOptionalComponent = (entity, component) => {
    const componentState = component?.stateMap[entity];
    return componentState?.promised ? undefined : componentState?.get(NO_PROXY_STEALTH);
};

export const getComponent = (entity, component) => {
    if (!bitECS.hasComponent(HyperFlux.store, component, entity)) {
        console.warn(
            `[getComponent] ${entity} does not have ${component.name}. This will be an error in the future. Use getOptionalComponent if there is uncertainty over whether or not an entity has the specified component.`,
        );
        return undefined;
    }
    const componentState = component?.stateMap[entity];
    return componentState.get(NO_PROXY_STEALTH);
};

/**
 * @description
 * Assigns the given component to the given entity, and returns the component.
 * @notes
 * - If the component already exists, it will be overwritten.
 * - Unlike calling {@link removeComponent} followed by {@link addComponent}, the entry queue will not be rerun.
 *
 * @param entity The entity to which the Component will be attached.
 * @param Component The Component that will be attached.
 * @param args `@todo` Explain what `setComponent(   args)` is
 * @returns The component that was attached.
 */
export const setComponent = (entity, Component, args = undefined) => {
    if (!entity && entity !== 0) {
        throw new Error("[setComponent] entity is undefined");
    }
    if (!bitECS.entityExists(HyperFlux.store, entity)) {
        throw new Error("[setComponent] entity does not exist");
    }
    const componentExists = hasComponent(entity, Component);
    if (!componentExists) {
        const value = Component.onInit(entity);

        if (!Component?.stateMap[entity]) {
            Component.stateMap[entity] = hookstate(value);
        } else {
            Component?.stateMap[entity]?.set(value);
        }

        bitECS.addComponent(HyperFlux.store, Component, entity, false); // don't clear data on-add
    }

    Component.onSet(entity, Component?.stateMap[entity], args);

    if (!componentExists && Component.reactor && !Component.reactorMap.has(entity)) {
        const root = startReactor(() => {
            return React.createElement(
                EntityContext.Provider,
                { value },
                React.createElement(Component.reactor, {}),
            );
        });
        root["entity"] = entity;
        root["component"] = Component.name;
        Component.reactorMap.set(entity, root);
        return getComponent(entity, Component);
    }

    const root = Component.reactorMap.get(entity);
    root?.run();
    return getComponent(entity, Component);
};

/**
 * @experimental
 * @description `@todo` Explain how `updateComponent` works.
 */
export const updateComponent = (entity, Component, props) => {
    if (typeof props === "undefined") return;

    const comp = getMutableComponent(entity, Component);
    if (!comp) {
        throw new Error("[updateComponent]: component does not exist " + Component.name);
    }

    startTransition(() => {
        if (typeof props !== "object") {
            // component has top level value (eg NameComponent)
            comp.set(props);
        } else {
            for (const propertyName of Object.keys(props)) {
                const value = props[propertyName];
                const { result, finalProp } = getNestedObject(comp, propertyName);
                if (
                    typeof value !== "undefined" &&
                    typeof result[finalProp] === "object" &&
                    typeof result[finalProp].set === "function"
                ) {
                    result[finalProp].set(value);
                } else {
                    result[finalProp] = value;
                }
            }
        }
        const root = Component.reactorMap.get(entity);
        if (!root?.isRunning) root?.run();
    });
};

export const hasComponent = (entity, component) => {
    if (!component) throw new Error("[hasComponent]: component is undefined");
    if (!entity) return false;
    return bitECS.hasComponent(HyperFlux.store, component, entity);
};

export const removeComponent = (entity, component) => {
    if (!hasComponent(entity, component)) return;
    component.onRemove(entity, component?.stateMap[entity]);
    bitECS.removeComponent(HyperFlux.store, component, entity, false);
    const root = component.reactorMap.get(entity);
    component.reactorMap.delete(entity);
    if (root?.isRunning) root.stop();
    /** clear state data after reactor stops, to ensure hookstate is still referenceable */
    component?.stateMap[entity]?.set(none);
};

/**
 * @description
 * Initializes a temporary Component of the same type that the given Component, using its {@link Component.onInit} function, and returns its serialized JSON data.
 * @notes The temporary Component won't be inserted into the ECS system, and its data will be GC'ed at the end of this function.
 * @param component The desired Component.
 * @returns JSON object containing the requested data.
 */
export const componentJsonDefaults = component => {
    const initial = component.onInit(UndefinedEntity);
    const pseudoState = {};
    for (const key of Object.keys(initial)) {
        pseudoState[key] = {
            value: initial[key],
            get: () => initial[key],
        };
    }
    return component.toJSON(UndefinedEntity, pseudoState);
};

export const getAllComponents = entity => {
    if (!bitECS.entityExists(HyperFlux.store, entity)) return [];
    return bitECS.getEntityComponents(HyperFlux.store, entity);
};

export const getAllComponentData = entity => {
    return Object.fromEntries(getAllComponents(entity).map(C => [C.name, getComponent(entity, C)]));
};

export const removeAllComponents = entity => {
    try {
        for (const component of bitECS.getEntityComponents(HyperFlux.store, entity)) {
            try {
                removeComponent(entity, component);
            } catch (e) {
                console.error(e);
            }
        }
    } catch (e) {
        console.error(e);
    }
};

export const serializeComponent = (entity, Component) => {
    const component = getMutableComponent(entity, Component);
    return JSON.parse(JSON.stringify(Component.toJSON(entity, component)));
};

// use seems to be unavailable in the server environment
export function _use(promise) {
    if (promise.status === "fulfilled") {
        return promise.value;
    } else if (promise.status === "rejected") {
        throw promise.reason;
    } else if (promise.status === "pending") {
        throw promise;
    } else {
        promise.status = "pending";
        promise.then(
            result => {
                promise.status = "fulfilled";
                promise.value = result;
            },
            reason => {
                promise.status = "rejected";
                promise.reason = reason;
            },
        );
        throw promise;
    }
}

/**
 * Use a component in a reactive context (a React component)
 */
export function useComponent(entity, Component) {
    if (entity === UndefinedEntity)
        throw new Error("InvalidUsage: useComponent called with UndefinedEntity");
    if (!Component?.stateMap[entity]) Component.stateMap[entity] = hookstate(none);
    const componentState = Component?.stateMap[entity];
    return useHookstate(componentState); // todo fix any cast
}

/**
 * Use a component in a reactive context (a React component)
 */
export function useOptionalComponent(entity, Component) {
    if (!Component?.stateMap[entity]) Component.stateMap[entity] = hookstate(none);
    const component = useHookstate(Component?.stateMap[entity]); // todo fix any cast
    return component.promised ? undefined : component;
}

export const getComponentCountOfType = component => {
    const query = defineQuery([component]);
    const length = query().length;
    bitECS.removeQuery(HyperFlux.store, query._query);
    return length;
};

export const getAllComponentsOfType = component => {
    const query = defineQuery([component]);
    const entities = query();
    bitECS.removeQuery(HyperFlux.store, query._query);
    return entities.map(e => {
        return getComponent(e, component);
    });
};
