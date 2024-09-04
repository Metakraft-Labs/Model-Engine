export function getNodeDescriptions(importWildcard) {
    return Object.values(importWildcard).filter(obj => typeof obj === "object");
}

export class NodeDescription {
    nodeFactory;

    constructor(
        typeName,
        category,
        label = "",
        factory,
        otherTypeNames = [],
        helpDescription = "",

        configurationDescription = {},
    ) {
        this.nodeFactory = (graph, config) => factory(this, graph, config);
    }
}

export class NodeDescription2 extends NodeDescription {
    constructor(properties) {
        super(
            properties.typeName,
            properties.category,
            properties.label,
            properties.factory,
            properties.otherTypeNames,
            properties.helpDescription,
            properties.configuration,
        );
    }
}
