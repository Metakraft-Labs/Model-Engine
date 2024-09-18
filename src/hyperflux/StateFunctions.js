import { extend, hookstate, useHookstate } from "@hookstate/core";
import { identifiable } from "@hookstate/identifiable";
import { resolveObject } from "../shared/objects";
import { startReactor } from "./ReactorFunctions";
import { HyperFlux } from "./StoreFunctions";
export * from "@hookstate/core";
export { useHookstate as useState } from "@hookstate/core";
export * from "@hookstate/identifiable";

/** @deprecated */
export const createState = hookstate;

export const NO_PROXY = { noproxy: true };
export const NO_PROXY_STEALTH = { noproxy: true, stealth: true };

export const StateDefinitions = new Map();

export const setInitialState = def => {
    const initial =
        typeof def.initial === "function" ? def.initial() : JSON.parse(JSON.stringify(def.initial));
    if (HyperFlux.store.stateMap[def.name]) {
        HyperFlux.store.stateMap[def.name].set(initial);
    } else {
        const state = (HyperFlux.store.stateMap[def.name] = hookstate(
            initial,
            extend(identifiable(def.name), def.extension),
        ));
        if (def.onCreate) def.onCreate(HyperFlux.store, state);
        if (def.reactor) {
            const reactor = startReactor(def.reactor);
            HyperFlux.store.stateReactors[def.name] = reactor;
        }
    }
};

export function defineState(definition) {
    if (StateDefinitions.has(definition.name))
        throw new Error(`State ${definition.name} already defined`);
    StateDefinitions.set(definition.name, definition);
    return definition;
}

export function getMutableState(StateDefinition) {
    if (!HyperFlux.store.stateMap[StateDefinition.name]) setInitialState(StateDefinition);
    return HyperFlux.store.stateMap[StateDefinition.name];
}

export function getState(StateDefinition) {
    if (!HyperFlux.store.stateMap[StateDefinition.name]) setInitialState(StateDefinition);
    return HyperFlux.store.stateMap[StateDefinition.name].get(NO_PROXY_STEALTH);
}

export function useMutableState(StateDefinition, path) {
    const rootState = getMutableState(StateDefinition);
    const resolvedState = path ? resolveObject(rootState, path) : rootState;
    return useHookstate(resolvedState);
}

const stateNamespaceKey = "ee.hyperflux";

export function syncStateWithLocalStorage(keys) {
    return () => {
        let rootState;

        return {
            onInit: state => {
                rootState = state;
                for (const key of keys) {
                    const storedValue = localStorage.getItem(
                        `${stateNamespaceKey}.${state.identifier}.${key}`,
                    );
                    if (storedValue !== null && storedValue !== "undefined")
                        state[key].set(JSON.parse(storedValue));
                }
            },
            onSet: (_state, _desc) => {
                for (const key of keys) {
                    const storageKey = `${stateNamespaceKey}.${rootState.identifier}.${key}`;
                    const value = rootState[key]?.get(NO_PROXY);
                    // We should still store flags that have been set to false or null
                    if (value === undefined) localStorage.removeItem(storageKey);
                    else localStorage.setItem(storageKey, JSON.stringify(value));
                }
            },
        };
    };
}
