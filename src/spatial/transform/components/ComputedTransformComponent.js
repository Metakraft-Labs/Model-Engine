import { matches } from "ts-matches";

import { defineComponent } from "../../../ecs/ComponentFunctions";

import { TransformComponent } from "./TransformComponent";

export const ComputedTransformComponent = defineComponent({
    name: "ComputedTransformComponent",

    onInit(entity) {
        return {
            referenceEntities: [],
            computeFunction: () => {},
        };
    },

    onSet(entity, component, json) {
        if (!json) return;

        matches.arrayOf(matches.number).test(json.referenceEntities) &&
            component.referenceEntities.set(json.referenceEntities);
        if (typeof json.computeFunction === "function")
            component.merge({ computeFunction: json.computeFunction });

        TransformComponent.transformsNeedSorting = true;
    },
});
