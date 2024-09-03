import React, { useEffect } from "react";
import {
    defineAction,
    defineState,
    getMutableState,
    getState,
    matches,
    matchesPeerID,
    NO_PROXY_STEALTH,
    none,
    useHookstate,
    useMutableState,
} from "../../../../hyperflux";
import { NetworkActions, NetworkState } from "../../NetworkState";
import {
    MediasoupTransportActions,
    MediasoupTransportObjectsState,
    MediasoupTransportState,
} from "./MediasoupTransportState";

export class MediasoupDataProducerActions {
    static requestProducer = defineAction({
        type: "ee.engine.network.mediasoup.DATA_REQUEST_PRODUCER",
        requestID: matches.string,
        transportID: matches.string,
        protocol: matches.string,
        sctpStreamParameters: matches.object,
        dataChannel: matches.string,
        appData: matches.object,
    });

    static requestProducerError = defineAction({
        type: "ee.engine.network.mediasoup.DATA_REQUEST_PRODUCER_ERROR",
        requestID: matches.string,
        error: matches.string,
    });

    static producerCreated = defineAction({
        type: "ee.engine.network.mediasoup.DATA_PRODUCER_CREATED",
        requestID: matches.string,
        producerID: matches.string,
        transportID: matches.string,
        protocol: matches.string,
        sctpStreamParameters: matches.object,
        dataChannel: matches.string,
        appData: matches.object,
    });

    static producerClosed = defineAction({
        type: "ee.engine.network.mediasoup.DATA_CLOSED_PRODUCER",
        producerID: matches.string,
    });
}

export class MediasoupDataConsumerActions {
    static requestConsumer = defineAction({
        type: "ee.engine.network.mediasoup.DATA_REQUEST_CONSUMER",
        dataChannel: matches.string,
    });

    static consumerCreated = defineAction({
        type: "ee.engine.network.mediasoup.DATA_CREATED_CONSUMER",
        consumerID: matches.string,
        peerID: matchesPeerID,
        producerID: matches.string,
        transportID: matches.string,
        dataChannel: matches.string,
        sctpStreamParameters: matches.object,
        appData: matches.object,
        protocol: matches.string,
    });

    static consumerClosed = defineAction({
        type: "ee.engine.network.mediasoup.DATA_CLOSED_CONSUMER",
        consumerID: matches.string,
    });
}

export const MediasoupDataProducersConsumersObjectsState = defineState({
    name: "ee.engine.network.mediasoup.MediasoupDataProducersAndConsumersObjectsState",

    initial: {
        producers: {},
        consumers: {},
    },
});

export const MediasoupDataProducerConsumerState = defineState({
    name: "ee.engine.network.mediasoup.DataProducerConsumerState",

    initial: {},

    getProducerByPeer: (networkID, peerID) => {
        const state = getState(MediasoupDataProducerConsumerState)[networkID];
        if (!state) return;

        const producer = Object.values(state.producers).find(p => p.appData.peerID === peerID);
        if (!producer) return;

        return getState(MediasoupDataProducersConsumersObjectsState).producers[producer.producerID];
    },

    getProducerByDataChannel: (networkID, dataChannel) => {
        const state = getState(MediasoupDataProducerConsumerState)[networkID];
        if (!state) return;

        const producer = Object.values(state.producers).find(p => p.dataChannel === dataChannel);
        if (!producer) return;

        return getState(MediasoupDataProducersConsumersObjectsState).producers[producer.producerID];
    },

    getConsumerByPeer: (networkID, peerID) => {
        const state = getState(MediasoupDataProducerConsumerState)[networkID];
        if (!state) return;

        const consumer = Object.values(state.consumers).find(c => c.appData.peerID === peerID);
        if (!consumer) return;

        return getState(MediasoupDataProducersConsumersObjectsState).consumers[consumer.consumerID];
    },

    getConsumerByDataChannel: (networkID, dataChannel) => {
        const state = getState(MediasoupDataProducerConsumerState)[networkID];
        if (!state) return;

        const consumer = Object.values(state.consumers).find(c => c.dataChannel === dataChannel);
        if (!consumer) return;

        return getState(MediasoupDataProducersConsumersObjectsState).consumers[consumer.consumerID];
    },

    receptors: {
        onProducerCreate: MediasoupDataProducerActions.producerCreated.receive(action => {
            const state = getMutableState(MediasoupDataProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) {
                state.merge({ [networkID]: { producers: {}, consumers: {} } });
            }
            state[networkID].producers.merge({
                [action.producerID]: {
                    producerID: action.producerID,
                    transportID: action.transportID,
                    protocol: action.protocol,
                    sctpStreamParameters: action.sctpStreamParameters,
                    dataChannel: action.dataChannel,
                    appData: action.appData,
                },
            });
        }),

        onProducerClosed: MediasoupDataProducerActions.producerClosed.receive(action => {
            const state = getMutableState(MediasoupDataProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) return;
            state[networkID].producers[action.producerID].set(none);
            if (
                !state[networkID].producers.keys.length &&
                !state[networkID].consumers.keys.length
            ) {
                state[networkID].set(none);
            }
        }),

        onConsumerCreated: MediasoupDataConsumerActions.consumerCreated.receive(action => {
            const state = getMutableState(MediasoupDataProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) {
                state.merge({ [networkID]: { producers: {}, consumers: {} } });
            }
            state[networkID].consumers.merge({
                [action.consumerID]: {
                    consumerID: action.consumerID,
                    transportID: action.transportID,
                    dataChannel: action.dataChannel,
                    sctpStreamParameters: action.sctpStreamParameters,
                    appData: action.appData,
                    protocol: action.protocol,
                },
            });
        }),

        onConsumerClosed: MediasoupDataConsumerActions.consumerClosed.receive(action => {
            const state = getMutableState(MediasoupDataProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) return;
            state[networkID].consumers[action.consumerID].set(none);
            if (
                !state[networkID].consumers.keys.length &&
                !state[networkID].consumers.keys.length
            ) {
                state[networkID].set(none);
            }
        }),

        onTransportClosed: MediasoupTransportActions.transportClosed.receive(action => {
            const network = action.$network;
            // if the transport is closed, we need to close all producers and consumers for that transport
            const state = getMutableState(MediasoupDataProducerConsumerState)[network];
            if (!state) return;

            for (const producerID of Object.keys(state.producers)) {
                if (state.producers[producerID].transportID.value !== action.transportID) continue;
                state.producers[producerID].set(none);
            }

            for (const consumerID of Object.keys(state.consumers)) {
                if (state.consumers[consumerID].transportID.value !== action.transportID) continue;
                state.consumers[consumerID].set(none);
            }

            if (!state.producers.keys.length && !state.consumers.keys.length) state.set(none);
        }),

        onUpdatePeers: NetworkActions.updatePeers.receive(action => {
            const state = getState(MediasoupDataProducerConsumerState);
            const producers = state[action.$network]?.producers;
            if (producers)
                for (const producer of Object.values(producers)) {
                    const transport =
                        getState(MediasoupTransportState)[action.$network][producer.transportID];
                    if (transport && action.peers.find(peer => peer.peerID === transport.peerID))
                        continue;
                    getMutableState(MediasoupDataProducerConsumerState)[action.$network].producers[
                        producer.producerID
                    ].set(none);
                }
            const consumers = state[action.$network]?.consumers;
            if (consumers)
                for (const consumer of Object.values(consumers)) {
                    const transport =
                        getState(MediasoupTransportState)[action.$network][consumer.transportID];
                    if (transport && action.peers.find(peer => peer.peerID === transport.peerID))
                        continue;
                    getMutableState(MediasoupDataProducerConsumerState)[action.$network].consumers[
                        consumer.consumerID
                    ].set(none);
                }
        }),
    },

    reactor: () => {
        const networkIDs = useMutableState(MediasoupDataProducerConsumerState);
        return (
            <>
                {networkIDs.keys.map(id => (
                    <NetworkReactor key={id} networkID={id} />
                ))}
            </>
        );
    },
});

export const NetworkDataProducer = props => {
    const { networkID, producerID } = props;
    const producerState = useHookstate(
        getMutableState(MediasoupDataProducerConsumerState)[networkID].producers[producerID],
    );
    const producerObjectState = useHookstate(
        getMutableState(MediasoupDataProducersConsumersObjectsState).producers[producerID],
    );
    const transportState = useHookstate(
        getMutableState(MediasoupTransportObjectsState)[producerState.transportID.value],
    );
    useEffect(() => {
        if (!transportState.value || !producerObjectState.value) return;
        const producerObject = producerObjectState.get(NO_PROXY_STEALTH);
        return () => {
            producerObject.close();
        };
    }, [transportState.value, producerObjectState.value]);

    return null;
};

export const NetworkDataConsumer = props => {
    const { networkID, consumerID } = props;
    const consumerState = useHookstate(
        getMutableState(MediasoupDataProducerConsumerState)[networkID].consumers[consumerID],
    );
    const consumerObjectState = useHookstate(
        getMutableState(MediasoupDataProducersConsumersObjectsState).consumers[consumerID],
    );
    const transportState = useHookstate(
        getMutableState(MediasoupTransportObjectsState)[consumerState.transportID.value],
    );

    useEffect(() => {
        if (!transportState.value || !consumerObjectState.value) return;
        const consumerObject = consumerObjectState.get(NO_PROXY_STEALTH);
        return () => {
            consumerObject.close();
        };
    }, [transportState.value, consumerObjectState.value]);

    return null;
};
const NetworkReactor = props => {
    const { networkID } = props;
    const producers = useHookstate(
        getMutableState(MediasoupDataProducerConsumerState)[networkID].producers,
    );
    const consumers = useHookstate(
        getMutableState(MediasoupDataProducerConsumerState)[networkID].consumers,
    );
    const network = useHookstate(getMutableState(NetworkState).networks[networkID]);

    if (!network.value) return null;

    return (
        <>
            {producers.keys.map(producerID => (
                <NetworkDataProducer
                    key={producerID}
                    producerID={producerID}
                    networkID={networkID}
                />
            ))}
            {consumers.keys.map(consumerID => (
                <NetworkDataConsumer
                    key={consumerID}
                    consumerID={consumerID}
                    networkID={networkID}
                />
            ))}
        </>
    );
};
