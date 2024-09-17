import { makeFlowNodeDefinition, NodeCategory } from "../../../VisualScriptModule";

export const Log = makeFlowNodeDefinition({
    typeName: "debug/log",
    category: NodeCategory.Debug,
    label: "Debug Log",
    in: {
        flow: "flow",
        text: "string",
        severity: {
            valueType: "string",
            defaultValue: "info",
            choices: ["verbose", "info", "warning", "error"],
            label: "severity",
        },
    },
    out: { flow: "flow" },
    initialState: undefined,
    triggered: ({ read, commit }) => {
        console.log(read("severity"), read("test"));
        commit("flow");
    },
});
