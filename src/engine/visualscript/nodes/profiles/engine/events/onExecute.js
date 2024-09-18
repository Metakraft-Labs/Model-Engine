import {
    defineSystem,
    destroySystem,
    ECSState,
    InputSystemGroup,
    SystemDefinitions,
} from "../../../../../../ecs";
import { getState } from "../../../../../../hyperflux";
import { makeEventNodeDefinition, NodeCategory } from "../../../../../../visual-script";

let onExecuteSystemCounter = 0;
const onExecuteSystemUUID = "visual-script-onExecute-";
export const getOnExecuteSystemUUID = () => onExecuteSystemUUID + onExecuteSystemCounter;

const initialState = () => ({
    systemUUID: "",
});

// very 3D specific.
export const OnExecute = makeEventNodeDefinition({
    typeName: "flow/lifecycle/onExecute",
    category: NodeCategory.Flow,
    label: "On Execute",
    in: {
        system: (_, _graphApi) => {
            const systemDefinitions = Array.from(SystemDefinitions.keys()).map(key => key);
            const groups = systemDefinitions.filter(key => key.includes("group")).sort();
            const nonGroups = systemDefinitions.filter(key => !key.includes("group")).sort();
            const choices = [...groups, ...nonGroups];
            return {
                valueType: "string",
                choices: choices,
                defaultValue: InputSystemGroup,
            };
        },
    },

    out: {
        flow: "flow",
        delta: "float",
    },
    initialState: initialState(),
    init: ({ read, write, commit }) => {
        const system = read("system");
        onExecuteSystemCounter++;
        const visualScriptOnExecuteSystem = defineSystem({
            uuid: getOnExecuteSystemUUID(),
            insert: { with: system },
            execute: () => {
                commit("flow");
                write("delta", getState(ECSState).deltaSeconds);
            },
        });

        const state = {
            systemUUID: visualScriptOnExecuteSystem,
        };

        return state;
    },
    dispose: ({ state: { systemUUID } }) => {
        destroySystem(systemUUID);
        return initialState();
    },
});
