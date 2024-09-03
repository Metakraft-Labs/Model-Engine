import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../../ecs/SystemGroups";
import { NetworkObjectAuthorityTag } from "../../../network";

import { applyGamepadInput } from ".././functions/moveAvatar";
import { AvatarControllerComponent } from "../components/AvatarControllerComponent";

const controlledAvatarEntity = defineQuery([AvatarControllerComponent, NetworkObjectAuthorityTag]);

const execute = () => {
    for (const entity of controlledAvatarEntity()) applyGamepadInput(entity);
};

export const AvatarMovementSystem = defineSystem({
    uuid: "ee.engine.AvatarMovementSystem",
    insert: { with: SimulationSystemGroup },
    execute,
});
