export function getNodeDescriptions(importWildcard) {
    return Object.values(importWildcard).filter(obj => typeof obj === "object");
}

export class NodeDescription {
    nodeFactory;

    constructor(
        _typeName,
        _category,
        _label = "",
        factory,
        _otherTypeNames = [],
        _helpDescription = "",

        _configurationDescription = {},
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
