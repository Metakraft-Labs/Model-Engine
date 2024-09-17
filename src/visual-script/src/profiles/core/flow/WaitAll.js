import { FlowNode, NodeDescription2, Socket } from "../../../VisualScriptModule";

// this is equivalent to Promise.all()
export class WaitAll extends FlowNode {
    static Description = new NodeDescription2({
        typeName: "flow/waitAll",
        category: "Flow",
        label: "WaitAll",
        configuration: {
            numInputs: {
                valueType: "number",
                defaultValue: 3,
            },
        },
        factory: (description, graph, configuration) =>
            new WaitAll(description, graph, configuration.numInputs),
    });

    isOn = true;

    constructor(description, graph, numInputs) {
        const inputs = [];
        for (let i = 1; i <= numInputs; i++) {
            inputs.push(new Socket("flow", `${i}`));
        }

        super(
            description,
            graph,
            [...inputs, new Socket("flow", "reset"), new Socket("boolean", "autoReset")],
            [new Socket("flow", "flow")],
        );

        this.reset();
    }

    triggeredMap = {};
    triggeredCount = 0;
    outputTriggered = false;

    reset() {
        for (let inputIndex = 1; inputIndex <= this.numInputs; inputIndex++) {
            this.triggeredMap[`${inputIndex}`] = false;
        }
        this.triggeredCount = 0;
        this.outputTriggered = false;
    }

    triggered(fiber, triggeringSocketName) {
        if (triggeringSocketName === "reset") {
            this.reset();
            return;
        }

        if (this.triggeredMap[triggeringSocketName]) {
            return;
        }

        this.triggeredMap[triggeringSocketName] = true;
        this.triggeredCount++;

        // if a & b are triggered, first output!
        if (this.triggeredCount === this.numInputs && !this.outputTriggered) {
            fiber.commit(this, "flow");
            this.outputTriggered = true;

            // auto-reset if required.
            if (this.readInput("autoReset") === true) {
                this.reset();
            }
        }
    }
}
