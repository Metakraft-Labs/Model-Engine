import { FlowNode, NodeCategory, NodeDescription, Socket } from "../../../VisualScriptModule";
import { ILogger, LogSeverity } from "../../ProfilesModule";

export class LogObject extends FlowNode {
    static Description = (logger: ILogger) =>
        new NodeDescription(
            "logic/object/log",
            NodeCategory.Logic,
            "Log",
            (description, graph) => new LogObject(description, graph, logger),
        );

    constructor(description, graph, logger: ILogger) {
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

    override triggered(fiber) {
        const text = this.readInput<string>("text");
        const payload = this.readInput<any>("payload");

        const message = `${text} ${JSON.stringify(payload)}`;

        this.logger.log(this.readInput<LogSeverity>("severity"), message);

        fiber.commit(this, "flow");
    }
}
