import { defineComponent } from "../../../ecs/ComponentFunctions";
import { hookstate, none } from "../../../hyperflux";

const entitiesBySource = {};

export const SourceComponent = defineComponent({
    name: "SourceComponent",

    onInit: entity => "",

    onSet: (entity, component, src) => {
        if (typeof src !== "string") throw new Error("SourceComponent expects a non-empty string");

        component.set(src);

        const exists = SourceComponent.entitiesBySource[src];
        const entitiesBySourceState = SourceComponent.entitiesBySourceState[src];
        if (exists) {
            if (exists.includes(entity)) return;
            entitiesBySourceState.merge([entity]);
        } else {
            entitiesBySourceState.set([entity]);
        }
    },

    onRemove: (entity, component) => {
        const src = component.value;

        const entities = SourceComponent.entitiesBySource[src].filter(
            currentEntity => currentEntity !== entity,
        );
        if (entities.length === 0) {
            SourceComponent.entitiesBySourceState[src].set(none);
        } else {
            SourceComponent.entitiesBySourceState[src].set(entities);
        }
    },

    entitiesBySourceState: hookstate(entitiesBySource),
    entitiesBySource: entitiesBySource,
});
