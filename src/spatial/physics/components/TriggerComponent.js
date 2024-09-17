import matches from "ts-matches";

import { defineComponent } from "../../../ecs";
import { NO_PROXY } from "../../../hyperflux";

export const TriggerComponent = defineComponent({
    name: "TriggerComponent",
    jsonID: "EE_trigger",

    onInit(_entity) {
        return {
            triggers: [],
        };
    },

    onSet(_entity, component, json) {
        if (!json) return;

        // backwards compatibility
        const onEnter = json.onEnter ?? null;
        const onExit = json.onExit ?? null;
        const target = json.target ?? null;
        if (!!onEnter || !!onExit || !!target) {
            component.triggers.set([{ onEnter, onExit, target }]);
        } else if (typeof json.triggers === "object") {
            if (
                matches
                    .arrayOf(
                        matches.shape({
                            onEnter: matches.nill.orParser(matches.string),
                            onExit: matches.nill.orParser(matches.string),
                            target: matches.nill.orParser(matches.string),
                        }),
                    )
                    .test(json.triggers)
            ) {
                component.triggers.set(json.triggers);
            }
        }
    },

    toJSON(entity, component) {
        return {
            triggers: component.triggers.get(NO_PROXY),
        };
    },
});
