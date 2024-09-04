// based on the description here: https://blog.webdevsimplified.com/2022-03/debounce-vs-throttle/

import {
    Assert,
    AsyncNode,
    NodeCategory,
    NodeDescription,
    Socket,
} from "../../../VisualScriptModule";

export class Throttle extends AsyncNode {
    static Description = new NodeDescription(
        "flow/rate/throttle",
        NodeCategory.Flow,
        "Throttle",
        (description, graph) => new Throttle(description, graph),
    );

    constructor(description, graph) {
        super(
            description,
            graph,
            [
                new Socket("flow", "flow"),
                new Socket("float", "duration", 1),
                new Socket("flow", "cancel"),
            ],
            [new Socket("flow", "flow")],
        );
    }

    triggerVersion = 0;
    timeoutPending = false;

    triggered(engine, triggeringSocketName, finished) {
        // if cancelling, just increment triggerVersion and do not set a timer. :)
        if (triggeringSocketName === "cancel") {
            if (this.timeoutPending) {
                this.triggerVersion++;
                this.timeoutPending = false;
            }
            return;
        }

        // if there is a valid timeout running, leave it.
        if (this.timeoutPending) {
            return;
        }

        // otherwise start it.
        this.triggerVersion++;
        const localTriggerCount = this.triggerVersion;
        this.timeoutPending = true;
        setTimeout(
            () => {
                if (this.triggerVersion !== localTriggerCount) {
                    return;
                }
                Assert.mustBeTrue(this.timeoutPending);
                this.timeoutPending = false;
                engine.commitToNewFiber(this, "flow");
                finished();
            },
            this.readInput<number>("duration") * 1000,
        );
    }

    dispose() {
        this.triggerVersion++; // equivalent to 'cancel' trigger behavior.
        this.timeoutPending = false;
    }
}
