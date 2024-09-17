import { omit } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useEdgesState, useNodesState } from "reactflow";

import { flowToVisual } from "../transformers/flowToVisual";
import { visualToFlow } from "../transformers/VisualToFlow";
import { autoLayout } from "../util/autoLayout";
import { hasPositionMetaData } from "../util/hasPositionMetaData";
import { useCustomNodeTypes } from "./useCustomNodeTypes";

export const fetchVisualScriptJson = async url => await (await fetch(url)).json();

/**
 * Hook that returns the nodes and edges for react-flow, and the visual script Json for the visual-script.
 * If nodes or edges are changes, the visual script json is updated automatically.
 * The visual script json can be set manually, in which case the nodes and edges are updated to match the visual script json.
 * @param param0
 * @returns
 */
export const useVisualScriptFlow = ({ initialVisualScriptJson, specGenerator }) => {
    const [visualScriptJson, setStoredVisualScriptJson] = useState();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [variables, setVariables] = useState([]);

    const setVisualScriptJson = useCallback(
        visualScriptJson => {
            if (!visualScriptJson) return;

            const [nodes, edges] = visualToFlow(visualScriptJson);

            if (hasPositionMetaData(visualScriptJson) === false) {
                autoLayout(nodes, edges);
            }

            setNodes(nodes);
            setEdges(edges);
            setStoredVisualScriptJson(visualScriptJson);
            setVariables(visualScriptJson.variables ?? []);
        },
        [setEdges, setNodes, setVariables],
    );

    useEffect(() => {
        if (!initialVisualScriptJson) return;
        setVisualScriptJson(initialVisualScriptJson);
    }, [initialVisualScriptJson, setVisualScriptJson]);

    useEffect(() => {
        if (!specGenerator) return;
        // when nodes and edges are updated, update the visual script json with the flow to visual behavior
        const visualScriptJson = flowToVisual(nodes, edges, variables, specGenerator);
        setStoredVisualScriptJson(visualScriptJson);
    }, [nodes, edges, variables, specGenerator]);

    const nodeTypes = useCustomNodeTypes({
        specGenerator,
    });

    const deleteNodes = deletedNodes => {
        const filterNodes = nodes.map(node => {
            if (!node.parentNode) return node;
            const parentNode = deletedNodes.find(deletedNode => deletedNode.id === node.parentNode);
            if (parentNode === undefined) return node;
            const newNode = omit(node, "parentNode");
            newNode.position.x += parentNode.position.x;
            newNode.position.y += parentNode.position.y;
            return newNode;
        });
        setNodes(filterNodes);
    };

    return {
        nodes,
        edges,
        variables,
        setVariables,
        onEdgesChange,
        onNodesChange,
        setVisualScriptJson,
        visualScriptJson,
        deleteNodes,
        nodeTypes,
    };
};
