import { defineComponent } from "../../ecs/ComponentFunctions";
import { hookstate, none } from "../../hyperflux";

const entitiesByName = {};

export const NameComponent = defineComponent({
    name: "NameComponent",

    onInit: () => "",

    onSet: (entity, component, name) => {
        if (typeof name !== "string") throw new Error("NameComponent expects a non-empty string");
        // remove the entity from the previous name state
        if (component.value && entitiesByName[component.value]) {
            const index = entitiesByName[component.value].indexOf(entity);
            NameComponent.entitiesByNameState[component.value][index].set(none);
            if (!entitiesByName[component.value].length)
                NameComponent.entitiesByNameState[component.value].set(none);
        }
        // set the new name
        component.set(name);
        // add the entity to the new name state
        const exists = NameComponent.entitiesByName[name];
        const entitiesByNameState = NameComponent.entitiesByNameState;
        if (exists) {
            if (!exists.includes(entity))
                entitiesByNameState.merge({ [name]: [...exists, entity] });
        } else entitiesByNameState.merge({ [name]: [entity] });
    },

    onRemove: (entity, component) => {
        const name = component.value;
        const namedEntities = NameComponent.entitiesByNameState[name];
        const isSingleton = namedEntities.length === 1;
        isSingleton && namedEntities.set(none);
        !isSingleton &&
            namedEntities.set(namedEntities.value.filter(namedEntity => namedEntity !== entity));
    },

    entitiesByNameState: hookstate(entitiesByName),
    entitiesByName: entitiesByName,
});
