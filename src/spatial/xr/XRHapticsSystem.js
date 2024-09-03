import { getComponent } from "../../ecs/ComponentFunctions";
import { defineQuery } from "../../ecs/QueryFunctions";
import { defineSystem } from "../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../ecs/SystemGroups";
import { defineActionQueue } from "../../hyperflux";

import { InputSourceComponent } from "../input/components/InputSourceComponent";
import { XRAction } from "./XRState";

const inputSourceQuery = defineQuery([InputSourceComponent]);

const vibrateControllerQueue = defineActionQueue(XRAction.vibrateController.matches);

const execute = () => {
    for (const action of vibrateControllerQueue()) {
        for (const inputSourceEntity of inputSourceQuery()) {
            const inputSourceComponent = getComponent(inputSourceEntity, InputSourceComponent);
            if (
                inputSourceComponent.source.gamepad &&
                inputSourceComponent.source.handedness === action.handedness
            ) {
                if ("hapticActuators" in inputSourceComponent.source.gamepad) {
                    // old meta quest API
                    inputSourceComponent.source.gamepad.hapticActuators?.[0]?.pulse(
                        action.value,
                        action.duration,
                    );
                    continue;
                }

                const actuator = inputSourceComponent.source.gamepad?.vibrationActuator;
                if (!actuator) continue;
                else actuator.playEffect("dual-rumble", { duration: action.duration });
            }
        }
    }
};

export const XRHapticsSystem = defineSystem({
    uuid: "ee.engine.XRHapticsSystem",
    insert: { after: PresentationSystemGroup },
    execute,
});
