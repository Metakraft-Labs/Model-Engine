import { FlowNode, NodeCategory, NodeDescription, Socket } from "../../../VisualScriptModule";
import { LogSeverity } from "../../ProfilesModule";

export class LogList extends FlowNode {
    static Description = logger =>
        new NodeDescription(
            "logic/list/log",
            NodeCategory.Logic,
            "Log",
            (description, graph) => new LogList(description, graph, logger),
        );

    constructor(description, graph, logger) {
        super(
            description,
            graph,
            [
                new Socket("flow", "flow"),
                new Socket("string", "text"),
                new Socket("string", "severity", "info"),
                new Socket("list", "payload"),
            ],
            [new Socket("flow", "flow")],
        );
    }

    triggered(fiber) {
        const text = this.readInput < string > "text";
        const payload = this.readInput < any > "payload";

        const message = `${text} ${JSON.stringify(payload)}`;

        this.logger.log(this.readInput < LogSeverity > "severity", message);

        fiber.commit(this, "flow");
    }
}
