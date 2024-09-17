import React, { useEffect, useState } from "react";

import { Node } from "../../panels/VisualScript/node";

const getCustomNodeTypes = specGenerator => {
    return specGenerator.getNodeTypes().reduce((nodes, nodeType) => {
        nodes[nodeType] = props => {
            const spec = specGenerator.getNodeSpec(nodeType, props.data.configuration);
            return <Node spec={spec} specGenerator={specGenerator} {...props} />;
        };
        return nodes;
    }, {});
};

export const useCustomNodeTypes = ({ specGenerator }) => {
    const [customNodeTypes, setCustomNodeTypes] = useState();
    useEffect(() => {
        if (!specGenerator) return;
        const customNodeTypes = getCustomNodeTypes(specGenerator);

        setCustomNodeTypes(customNodeTypes);
    }, [specGenerator]);

    return customNodeTypes;
};
