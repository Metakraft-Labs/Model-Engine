import { Engine } from "../../ecs";
import { getState } from "../../hyperflux";
import { DataChannelRegistryState } from "./DataChannelRegistry";
import { NetworkActionFunctions } from "./functions/NetworkActionFunctions";

/**
 * Network topics are classes of networks. Topics are used to disitinguish between multiple networks of the same type.
 */
export const NetworkTopics = {
    world: "world",
    media: "media",
};

/** Interface for the Transport. */
export const createNetwork = (id, hostPeerID, topic, extension) => {
    const network = {
        messageToPeer: (peerId, data) => {
            network.peers[peerId]?.transport?.message?.(data);
        },
        messageToAll: data => {
            for (const peer of Object.values(network.peers))
                network.messageToPeer(peer.peerID, data);
        },
        onMessage: (fromPeerID, message) => {
            const actions = message;
            // const actions = decode(new Uint8Array(message)) as IncomingActionType[]
            NetworkActionFunctions.receiveIncomingActions(network, fromPeerID, actions);
        },
        bufferToPeer: (dataChannelType, _fromPeerID, peerID, data) => {
            network.peers[peerID]?.transport?.buffer?.(dataChannelType, data);
        },
        bufferToAll: (dataChannelType, fromPeerID, data) => {
            for (const peer of Object.values(network.peers))
                network.bufferToPeer(dataChannelType, fromPeerID, peer.peerID, data);
        },
        onBuffer: (dataChannelType, fromPeerID, data) => {
            const dataChannelFunctions = getState(DataChannelRegistryState)[dataChannelType];
            if (dataChannelFunctions) {
                for (const func of dataChannelFunctions)
                    func(network, dataChannelType, fromPeerID, data);
            }
        },
        ...extension,
        peers: {},
        peerIndexToPeerID: {},
        peerIDToPeerIndex: {},
        peerIndexCount: 0,
        users: {},
        userIndexToUserID: {},
        userIDToUserIndex: {},
        userIndexCount: 0,
        hostPeerID,
        get hostUserID() {
            return network.peers[network.hostPeerID]?.userId;
        },
        id,
        ready: false,
        get isHosting() {
            return Engine.instance.store.peerID === network.hostPeerID;
        },
        topic,
    };

    return network;
};
