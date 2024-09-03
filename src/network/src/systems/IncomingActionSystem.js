import { defineSystem } from "../../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../../ecs/SystemGroups";
import { applyIncomingActions } from "../../../hyperflux";

const execute = () => {
    applyIncomingActions();
};

export const IncomingActionSystem = defineSystem({
    uuid: "ee.engine.IncomingActionSystem",
    insert: { before: SimulationSystemGroup },
    execute,
});
