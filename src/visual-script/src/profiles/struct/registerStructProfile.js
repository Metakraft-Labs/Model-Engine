/* eslint-disable max-len */

import { getNodeDescriptions, memo } from "../../VisualScriptModule";
import { getStringConversionsForValueType } from "../registerSerializersForValueType";
import { ListNodes, ObjectNodes, ObjectValue } from "./StructProfileModule";
import { ListValue } from "./values/ListValue";

export const getStructValuesMap = memo(() => {
    const valueTypes = [ObjectValue, ListValue];
    const temp = Object.fromEntries(valueTypes.map(valueType => [valueType.name, valueType]));
    return temp;
});

export const getStructStringConversions = values =>
    Object.keys(values).flatMap(valueTypeName =>
        getStringConversionsForValueType({ values, valueTypeName }),
    );

export const getStructNodesMap = memo(() => {
    /*const structValueTypeNames = Object.keys({
    ...getStructValuesMap()
  });*/ //only neeeded when creating nodes for scene properties

    const nodeDefinitions = [
        // pull in value type nodes
        ...getNodeDescriptions(ObjectNodes),
        ...getNodeDescriptions(ListNodes),
        //...SetSceneProperty(structValueTypeNames),
        //...GetSceneProperty(structValueTypeNames), //need imports from scene, not sure if we even want this
        ...getStructStringConversions(getStructValuesMap()),
    ];

    return Object.fromEntries(
        nodeDefinitions.map(nodeDefinition => [nodeDefinition.typeName, nodeDefinition]),
    );
});

export const registerStructProfile = registry => {
    const values = {
        ...registry.values,
        ...getStructValuesMap(),
    };
    return {
        values,
        nodes: { ...registry.nodes, ...getStructNodesMap() },
        dependencies: {
            ...registry.dependencies,
        },
    };
};
