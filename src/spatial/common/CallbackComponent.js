import {
    defineComponent,
    getComponent,
    hasComponent,
    setComponent,
} from "../../ecs/ComponentFunctions";

export const CallbackComponent = defineComponent({
    name: "CallbackComponent",
    onInit: _entity => new Map(),
});

export function setCallback(entity, key, callback) {
    if (!hasComponent(entity, CallbackComponent))
        setComponent(entity, CallbackComponent, new Map());
    const callbacks = getComponent(entity, CallbackComponent);
    callbacks.set(key, callback);
    callbacks[key] = key; // for inspector
}

export function getCallback(entity, key) {
    if (!hasComponent(entity, CallbackComponent)) return undefined;
    return getComponent(entity, CallbackComponent).get(key);
}
