import { Assert, makeEventNodeDefinition, NodeCategory } from "../../../../VisualScriptModule";

const initialState = () => ({});

// very 3D specific.
export const OnSceneNodeClick = makeEventNodeDefinition({
    typeName: "scene/nodeClick",
    category: NodeCategory.None,
    label: "On Scene Node Click",
    in: {
        jsonPath: (_, graphApi) => {
            const scene = graphApi.getDependency("IScene");

            return {
                valueType: "string",
                choices: scene?.getRaycastableProperties(),
            };
        },
    },
    out: {
        flow: "flow",
    },
    initialState: initialState(),
    init: ({ read, commit, graph }) => {
        const handleNodeClick = () => {
            commit("flow");
        };

        const jsonPath = read < string > "jsonPath";

        const scene = graph.getDependency("IScene");
        scene?.addOnClickedListener(jsonPath, handleNodeClick);

        const state = {
            handleNodeClick,
            jsonPath,
        };

        return state;
    },
    dispose: ({ state: { handleNodeClick, jsonPath }, graph: { getDependency } }) => {
        Assert.mustBeTrue(handleNodeClick !== undefined);
        Assert.mustBeTrue(jsonPath !== undefined);

        if (!jsonPath || !handleNodeClick) return {};

        const scene = getDependency("scene");
        scene?.removeOnClickedListener(jsonPath, handleNodeClick);

        return {};
    },
});
