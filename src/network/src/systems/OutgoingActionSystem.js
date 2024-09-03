import { defineSystem } from "../../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../../ecs/SystemGroups";
import { dispatchAction } from "../../../hyperflux";
import { NetworkActionFunctions } from "../functions/NetworkActionFunctions";
import { NetworkActions } from "../NetworkState";

/** Publish to connected peers that peer information has changed */
export const updatePeers = network => {
    const peers = Object.values(network.peers).map(peer => {
        return {
            peerID: peer.peerID,
            peerIndex: peer.peerIndex,
            userID: peer.userId,
            userIndex: peer.userIndex,
        };
    });
    const action = NetworkActions.updatePeers({
        peers,
        $topic: network.topic,
        $network: network.id,
    });
    dispatchAction(action);
    return action;
};

const execute = () => {
    NetworkActionFunctions.sendOutgoingActions();
};

export const OutgoingActionSystem = defineSystem({
    uuid: "ee.engine.OutgoingActionSystem",
    insert: { after: SimulationSystemGroup },
    execute,
});
