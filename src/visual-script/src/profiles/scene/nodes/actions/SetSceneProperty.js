import { makeFlowNodeDefinition, NodeCategory } from "../../../../VisualScriptModule";

export const SetSceneProperty = valueTypeNames =>
    valueTypeNames.map(valueTypeName =>
        makeFlowNodeDefinition({
            typeName: `scene/set/${valueTypeName}`,
            category: NodeCategory.None,
            label: `Set scene ${valueTypeName}`,
            in: {
                jsonPath: (_, graphApi) => {
                    const scene = graphApi.getDependency("IScene");
                    return {
                        valueType: "string",
                        choices: scene?.getProperties(),
                    };
                },
                value: valueTypeName,
                flow: "flow",
            },
            out: {
                flow: "flow",
            },
            initialState: undefined,
            triggered: ({ commit, read, graph }) => {
                const scene = graph.getDependency("IScene");
                scene?.setProperty(read("jsonPath"), valueTypeName, read("value"));
                commit("flow");
            },
        }),
    );
