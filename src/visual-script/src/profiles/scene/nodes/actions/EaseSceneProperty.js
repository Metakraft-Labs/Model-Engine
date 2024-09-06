import {
    AsyncNode,
    EasingFunctions,
    EasingModes,
    NodeDescription,
    Socket,
    toCamelCase,
} from "../../../../VisualScriptModule";

export class EaseSceneProperty extends AsyncNode {
    static GetDescriptions(scene, lifecycleEventEmitter, ...valueTypeNames) {
        return valueTypeNames.map(
            valueTypeName =>
                new NodeDescription(
                    `scene/ease/${valueTypeName}`,
                    "Action",
                    `Ease Scene ${toCamelCase(valueTypeName)}`,
                    (description, graph) =>
                        new EaseSceneProperty(
                            description,
                            graph,
                            valueTypeName,
                            scene,
                            lifecycleEventEmitter,
                        ),
                ),
        );
    }

    constructor(description, graph, valueTypeName, scene, lifecycleEventEmitter) {
        super(
            description,
            graph,
            [
                new Socket("flow", "flow"),
                new Socket("string", "jsonPath"),
                new Socket(valueTypeName, "value"),
                new Socket(
                    "string",
                    "easingFunction",
                    "linear",
                    undefined,
                    Object.keys(EasingFunctions),
                ),
                new Socket("string", "easingMode", "inOut", undefined, Object.keys(EasingModes)),
                new Socket("float", "easeDuration"),
                new Socket("flow", "cancel"),
            ],
            [new Socket("flow", "flow")],
        );
    }

    initialValue = undefined;
    targetValue = undefined;
    duration = 0;
    elapsedDuration = 0;
    easing = EasingFunctions["linear"];
    startTime = 0;
    onTick = undefined;

    triggered(engine, triggeringSocketName, finished) {
        if (triggeringSocketName === "cancel") {
            this.dispose();
            finished();
            return;
        }

        // if existing ease in progress, do nothing
        if (this.elapsedDuration >= this.duration) {
            return;
        }

        this.initialValue = this.scene.getProperty(this.readInput("jsonPath"), this.valueTypeName);
        this.targetValue = this.readInput("value");
        this.duration = this.readInput < number > "duration";
        this.elapsedDuration = 0;
        this.startTime = Date.now();

        const easingFunction = EasingFunctions[this.readInput("easingFunction")];
        const easingMode = EasingModes[this.readInput("easingMode")];
        this.easing = easingMode(easingFunction);

        const updateOnTick = () => {
            const valueType = this.graph.values[this.valueTypeName];
            this.elapsedDuration = (Date.now() - this.startTime) / 1000;

            const t = Math.min(this.elapsedDuration / this.duration, 1);
            const easedValue = valueType.lerp(this.initialValue, this.targetValue, this.easing(t));

            this.scene.setProperty(this.readInput("jsonPath"), this.valueTypeName, easedValue);

            if (this.elapsedDuration >= this.duration) {
                this.dispose();
                engine.commitToNewFiber(this, "flow");
                finished();
            }
        };

        this.onTick = updateOnTick;
        this.lifecycleEventEmitter.tickEvent.addListener(this.onTick);
    }

    dispose() {
        this.elapsedDuration = this.duration = 0;
        if (this.onTick !== undefined) {
            this.lifecycleEventEmitter.tickEvent.removeListener(this.onTick);
            this.onTick = undefined;
        }
    }
}
