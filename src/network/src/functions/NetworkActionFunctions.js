import { Engine } from "../../../ecs/Engine";
import {
    addOutgoingTopicIfNecessary,
    clearOutgoingActions,
    dispatchAction,
    getState,
} from "../../../hyperflux";
import { NetworkState } from "../NetworkState";

const receiveIncomingActions = (network, _fromPeerID, actions) => {
    if (network.isHosting) {
        for (const a of actions) {
            a.$network = network.id;
            dispatchAction(a);
        }
    } else {
        for (const a of actions) {
            Engine.instance.store.actions.incoming.push(a);
        }
    }
};

const sendActionsAsPeer = network => {
    const outgoing = Engine.instance.store.actions.outgoing[network.topic];
    if (!outgoing?.queue?.length) return;
    const actions = [];
    for (const action of outgoing.queue) {
        if (action.$network && !action.$topic && action.$network === network.id)
            action.$topic = network.topic;
        if (action.$to === Engine.instance.store.peerID) continue;
        actions.push(action);
    }
    // for (const peerID of network.peers) {
    network.messageToPeer(
        network.hostPeerID,
        /*encode(*/ actions, //)
    );
    clearOutgoingActions(network.topic);
};

const sendActionsAsHost = network => {
    addOutgoingTopicIfNecessary(network.topic);

    const actions = [...Engine.instance.store.actions.outgoing[network.topic].queue];
    if (!actions.length) return;

    for (const peerID of Object.keys(network.peers)) {
        const arr = [];
        for (const a of [...actions]) {
            const action = { ...a };
            if (action.$network) {
                if (action.$network !== network.id) continue;
                else action.$topic = network.topic;
            }
            if (!action.$to) continue;
            if (
                action.$to === "all" ||
                (action.$to === "others" && peerID !== action.$peer) ||
                action.$to === peerID
            ) {
                arr.push(action);
            }
        }
        if (arr.length)
            network.messageToPeer(
                peerID,
                /*encode(*/ arr, //)
            );
    }

    // TODO: refactor this to support multiple connections of the same topic type
    clearOutgoingActions(network.topic);
};

const sendOutgoingActions = () => {
    for (const network of Object.values(getState(NetworkState).networks)) {
        try {
            if (Engine.instance.store.peerID === network.hostPeerID) sendActionsAsHost(network);
            else sendActionsAsPeer(network);
        } catch (e) {
            console.error(e);
        }
    }
};

export const NetworkActionFunctions = {
    sendActionsAsPeer,
    sendActionsAsHost,
    sendOutgoingActions,
    receiveIncomingActions,
};
