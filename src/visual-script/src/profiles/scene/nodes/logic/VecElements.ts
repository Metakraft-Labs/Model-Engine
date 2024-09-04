import { FunctionNode, Socket } from "../../../../VisualScriptModule";

export class VecElements extends FunctionNode {
    constructor(
        description,
        graph,
        valueTypeName,
        elementNames = ["x", "y", "z", "w"],
        toArray: (value: T, array, offset) => void,
    ) {
        super(
            description,
            graph,
            [new Socket(valueTypeName, "value")],
            elementNames.map(elementName => new Socket("float", elementName)),
            () => {
                const value = this.readInput("value") as T;
                const elementValues = elementNames.map(() => 0);
                toArray(value, elementValues, 0);
                elementNames.forEach((elementName, index) =>
                    this.writeOutput(elementName, elementValues[index]),
                );
            },
        );
    }
}
