import { FlowNode, NodeCategory, NodeDescription, Socket } from "../../../VisualScriptModule";

export class LogObject extends FlowNode {
    static Description = logger =>
        new NodeDescription(
            "logic/object/log",
            NodeCategory.Logic,
            "Log",
            (description, graph) => new LogObject(description, graph, logger),
        );

    constructor(description, graph, logger) {
        super(
            description,
            graph,
            [
                new Socket("flow", "flow"),
                new Socket("string", "text"),
                new Socket("string", "severity", "info"),
                new Socket("object", "payload"),
            ],
            [new Socket("flow", "flow")],
        );
    }

    triggered(fiber) {
        const text = this.readInput("text");
        const payload = this.readInput("payload");

        const message = `${text} ${JSON.stringify(payload)}`;

        this.logger.log(this.readInput("severity"), message);

        fiber.commit(this, "flow");
    }
}
