import { v4 as uuidv4 } from "uuid";
import { hookstate, NO_PROXY_STEALTH, useHookstate } from "../hyperflux";
import { defineComponent, setComponent } from "./ComponentFunctions";
import { UndefinedEntity } from "./Entity";
import { createEntity } from "./EntityFunctions";

export const UUIDComponent = defineComponent({
    name: "UUIDComponent",
    jsonID: "EE_uuid",

    onInit: () => "",

    onSet: (entity, component, uuid) => {
        if (!uuid) throw new Error("UUID cannot be empty");

        if (component.value === uuid) return;

        // throw error if uuid is already in use
        const currentEntity = UUIDComponent.getEntityByUUID(uuid);
        if (currentEntity !== UndefinedEntity && currentEntity !== entity) {
            throw new Error(`UUID ${uuid} is already in use`);
        }

        // remove old uuid
        if (component.value) {
            const currentUUID = component.value;
            _getUUIDState(currentUUID).set(UndefinedEntity);
        }

        // set new uuid
        component.set(uuid);
        _getUUIDState(uuid).set(entity);
    },

    toJSON(_entity, component) {
        return component.value;
    },

    onRemove: (_entity, component) => {
        const uuid = component.value;
        _getUUIDState(uuid).set(UndefinedEntity);
    },

    entitiesByUUIDState: {},

    useEntityByUUID(uuid) {
        return useHookstate(_getUUIDState(uuid)).value;
    },

    getEntityByUUID(uuid) {
        return _getUUIDState(uuid).get(NO_PROXY_STEALTH);
    },

    getOrCreateEntityByUUID(uuid) {
        const state = _getUUIDState(uuid);
        if (!state.value) {
            const entity = createEntity();
            setComponent(entity, UUIDComponent, uuid);
        }
        return state.value;
    },

    generateUUID() {
        return uuidv4();
    },
});

function _getUUIDState(uuid) {
    let entityState = UUIDComponent.entitiesByUUIDState[uuid];
    if (!entityState) {
        entityState = hookstate(UndefinedEntity);
        UUIDComponent.entitiesByUUIDState[uuid] = entityState;
    }
    return entityState;
}
