import { defineComponent } from "../../../ecs";

/** InputSinkComponent - receives input from input entities.  */
export const InputSinkComponent = defineComponent({
    name: "InputSinkComponent",

    onInit: () => {
        return {
            /**
             * The set of entities that are actively channeling input into this Entity Tree
             */
            inputEntities: [],
        };
    },
});
