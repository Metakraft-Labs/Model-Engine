import { defineQuery } from "../../../ecs";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { NetworkObjectAuthorityTag } from "../../../network";

import { AvatarControllerComponent } from "../components/AvatarControllerComponent";
import { applyAutopilotInput } from "../functions/moveAvatar";
import { AvatarMovementSystem } from "./AvatarMovementSystem";

const controllableAvatarQuery = defineQuery([AvatarControllerComponent, NetworkObjectAuthorityTag]);

const execute = () => {
    for (const entity of controllableAvatarQuery()) {
        applyAutopilotInput(entity);
    }
};

export const AvatarAutopilotSystem = defineSystem({
    uuid: "ee.engine.AvatarAutopilotSystem",
    insert: { after: AvatarMovementSystem },
    execute,
});
