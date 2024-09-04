import { defineState, getMutableState } from "../../../hyperflux";

import { createBaseRegistry } from "../functions/createRegistry";

export const VisualScriptDomain = {
    ECS: "ECS",
};

export const VisualScriptState = defineState({
    name: "VisualScriptState",
    initial: () => {
        const registry = createBaseRegistry();
        return {
            templates: [],
            registries: {
                [VisualScriptDomain.ECS]: registry,
            },
        };
    },

    registerProfile: (register, domain) => {
        getMutableState(VisualScriptState).registries[domain].set(current => register(current));
    },
});
