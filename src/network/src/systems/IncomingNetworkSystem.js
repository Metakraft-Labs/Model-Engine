import { useEffect } from "react";
import { RingBuffer } from "../../../common/src/utils/RingBuffer";
import { ECSState } from "../../../ecs/ECSState";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../../ecs/SystemGroups";
import { defineState, getState } from "../../../hyperflux";
import { addDataChannelHandler, removeDataChannelHandler } from "../DataChannelRegistry";
import { NetworkState } from "../NetworkState";
import { readDataPacket } from "../serialization/DataReader";

const toArrayBuffer = buf => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
};

export const IncomingNetworkState = defineState({
    name: "ee.core.network.IncomingNetworkState",
    initial: () => ({
        jitterBufferTaskList: [],
        jitterBufferDelay: 100,
        incomingMessageQueueUnreliableIDs: new RingBuffer(100),
        incomingMessageQueueUnreliable: new RingBuffer(100),
    }),
});

export const ecsDataChannelType = "ee.core.ecs.dataChannel";
const handleNetworkdata = (network, _dataChannel, fromPeerID, message) => {
    const { incomingMessageQueueUnreliable, incomingMessageQueueUnreliableIDs } =
        getState(IncomingNetworkState);
    if (network.isHosting) {
        incomingMessageQueueUnreliable.add(toArrayBuffer(message));
        incomingMessageQueueUnreliableIDs.add(fromPeerID);
        // forward data to clients in world immediately
        // TODO: need to include the userId (or index), so consumers can validate
        network.bufferToAll(ecsDataChannelType, fromPeerID, message);
    } else {
        incomingMessageQueueUnreliable.add(message);
        incomingMessageQueueUnreliableIDs.add(fromPeerID);
    }
};

function oldestFirstComparator(a, b) {
    return b.simulationTime - a.simulationTime;
}

const execute = () => {
    const ecsState = getState(ECSState);

    const {
        jitterBufferTaskList,
        jitterBufferDelay,
        incomingMessageQueueUnreliable,
        incomingMessageQueueUnreliableIDs,
    } = getState(IncomingNetworkState);

    const network = NetworkState.worldNetwork;
    if (!network) return;

    while (incomingMessageQueueUnreliable.getBufferLength() > 0) {
        // we may need producer IDs at some point, likely for p2p netcode, for now just consume it
        incomingMessageQueueUnreliableIDs.pop();
        const packet = incomingMessageQueueUnreliable.pop();

        readDataPacket(network, packet, jitterBufferTaskList);
    }

    jitterBufferTaskList.sort(oldestFirstComparator);

    const targetFixedTime = ecsState.simulationTime + jitterBufferDelay;

    for (const [index, { simulationTime, read }] of jitterBufferTaskList.slice().entries()) {
        if (simulationTime <= targetFixedTime) {
            read();
            jitterBufferTaskList.splice(index, 1);
        }
    }
};

const reactor = () => {
    useEffect(() => {
        addDataChannelHandler(ecsDataChannelType, handleNetworkdata);
        return () => {
            removeDataChannelHandler(ecsDataChannelType, handleNetworkdata);
        };
    }, []);
    return null;
};

export const IncomingNetworkSystem = defineSystem({
    uuid: "ee.engine.IncomingNetworkSystem",
    insert: { before: SimulationSystemGroup },
    execute,
    reactor,
});
