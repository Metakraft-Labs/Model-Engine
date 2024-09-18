import {
    defineQuery,
    defineSystem,
    destroySystem,
    getComponent,
    InputSystemGroup,
    removeQuery,
} from "../../../../../../ecs";
import { InputSourceComponent } from "../../../../../../spatial/input/components/InputSourceComponent";
import {
    StandardGamepadAxes,
    XRStandardGamepadAxes,
} from "../../../../../../spatial/input/state/ButtonState";
import { makeEventNodeDefinition, NodeCategory } from "../../../../../../visual-script";

let systemCounter = 0;

const initialState = () => ({
    query: undefined,
    systemUUID: "",
});

// very 3D specific.
export const OnAxis = makeEventNodeDefinition({
    typeName: "engine/axis/use",
    category: NodeCategory.Engine,
    label: "Use Axis",
    in: {
        axis: (_, _graphApi) => {
            const choices = [
                ...Object.keys(StandardGamepadAxes)
                    .filter(x => !(parseInt(x) >= 0))
                    .sort()
                    .map(value => ({ text: `gamepad/${value}`, value })),
                ...Object.keys(XRStandardGamepadAxes)
                    .filter(x => !(parseInt(x) >= 0))
                    .sort()
                    .map(value => ({ text: `xr-gamepad/${value}`, value })),
            ];
            return {
                valueType: "integer",
                choices: choices,
                defaultValue: choices[0].value,
            };
        },
        deadzone: "float",
    },
    out: {
        flow: "flow",
        entity: "entity",
        value: "float",
    },
    initialState: initialState(),
    init: ({ read, write, commit }) => {
        const axisKey = read("axis");
        const deadzone = read("deadzone");

        const query = defineQuery([InputSourceComponent]);
        const systemUUID = defineSystem({
            uuid: "visual-script-onAxis-" + systemCounter++,
            insert: { with: InputSystemGroup },
            execute: () => {
                for (const eid of query()) {
                    const inputSource = getComponent(eid, InputSourceComponent);
                    if (!inputSource.source.gamepad) continue;
                    let gamepadAxesValue = inputSource.source.gamepad?.axes[axisKey];
                    if (Math.abs(gamepadAxesValue) < deadzone) gamepadAxesValue = 0;
                    write("value", eid);
                    write("value", gamepadAxesValue);
                    commit("flow");
                }
            },
        });

        const state = {
            query,
            systemUUID,
        };

        return state;
    },
    dispose: ({ state: { query, systemUUID } }) => {
        destroySystem(systemUUID);
        removeQuery(query);
        return initialState();
    },
});
