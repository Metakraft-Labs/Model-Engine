import { Engine } from "../../../ecs/Engine";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { SimulationSystemGroup } from "../../../ecs/SystemGroups";
import { NetworkObjectAuthorityTag, NetworkObjectComponent } from "../NetworkObjectComponent";
import { NetworkState } from "../NetworkState";
import { createDataWriter } from "../serialization/DataWriter";
import { ecsDataChannelType } from "./IncomingNetworkSystem";

/***********
 * QUERIES *
 **********/

export const networkQuery = defineQuery([NetworkObjectComponent, NetworkObjectAuthorityTag]);

const serializeAndSend = serialize => {
    const ents = networkQuery();
    if (ents.length > 0) {
        const network = NetworkState.worldNetwork;
        const peerID = Engine.instance.store.peerID;
        const data = serialize(network, peerID, ents);

        // todo: insert historian logic here

        if (data.byteLength > 0) {
            // side effect - network IO
            // delay until end of frame
            Promise.resolve().then(() => network.bufferToAll(ecsDataChannelType, peerID, data));
        }
    }
};

const serialize = createDataWriter();

const execute = () => {
    NetworkState.worldNetwork && serializeAndSend(serialize);
};

export const OutgoingNetworkSystem = defineSystem({
    uuid: "ee.engine.OutgoingNetworkSystem",
    insert: { after: SimulationSystemGroup },
    execute,
});
