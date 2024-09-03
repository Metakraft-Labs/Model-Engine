import React, { useEffect } from "react";
import {
    NO_PROXY_STEALTH,
    defineAction,
    defineState,
    dispatchAction,
    getMutableState,
    getState,
    matches,
    matchesPeerID,
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

export class MediasoupMediaProducerActions {
    static requestProducer = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CREATE_PRODUCER",
        requestID: matches.string,
        transportID: matches.string,
        kind: matches.literals("audio", "video").optional(),
        rtpParameters: matches.object,
        paused: matches.boolean,
        appData: matches.object,
    });

    static requestProducerError = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CREATE_PRODUCER_ERROR",
        requestID: matches.string,
        error: matches.string,
    });

    static producerCreated = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_PRODUCER_CREATED",
        requestID: matches.string,
        producerID: matches.string,
        transportID: matches.string,
        peerID: matchesPeerID,
        mediaTag: matches.string,
        channelID: matches.string,
        $cache: true,
    });

    static producerClosed = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CLOSED_PRODUCER",
        producerID: matches.string,
        $cache: true,
    });

    static producerPaused = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_PRODUCER_PAUSED",
        producerID: matches.string,
        paused: matches.boolean,
        globalMute: matches.boolean,
        $cache: {
            removePrevious: ["producerID"],
        },
    });
}

export class MediasoupMediaConsumerActions {
    static requestConsumer = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_REQUEST_CONSUMER",
        peerID: matchesPeerID,
        mediaTag: matches.string,
        rtpCapabilities: matches.object,
        channelID: matches.string,
    });

    static consumerCreated = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CREATED_CONSUMER",
        consumerID: matches.string,
        transportID: matches.string,
        peerID: matchesPeerID,
        mediaTag: matches.string,
        channelID: matches.string,
        producerID: matches.string,
        kind: matches.literals("audio", "video").optional(),
        rtpParameters: matches.object,
        consumerType: matches.string,
        paused: matches.boolean,
        producerPaused: matches.boolean,
    });

    static consumerLayers = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CONSUMER_LAYERS",
        consumerID: matches.string,
        layer: matches.number,
    });

    static consumerClosed = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CLOSED_CONSUMER",
        consumerID: matches.string,
    });

    static consumerPaused = defineAction({
        type: "ee.engine.network.mediasoup.MEDIA_CONSUMER_PAUSED",
        consumerID: matches.string,
        paused: matches.boolean,
    });
}

export const MediasoupMediaProducersConsumersObjectsState = defineState({
    name: "ee.engine.network.mediasoup.MediasoupMediaProducersAndConsumersObjectsState",

    initial: {
        producers: {},
        consumers: {},
    },
});

export const MediasoupMediaProducerConsumerState = defineState({
    name: "ee.engine.network.mediasoup.MediasoupMediaProducerConsumerState",

    initial: {},

    getProducerByPeerIdAndMediaTag: (networkID, peerID, mediaTag) => {
        const state = getState(MediasoupMediaProducerConsumerState)[networkID];
        if (!state) return;

        const producer = Object.values(state.producers).find(
            p => p.peerID === peerID && p.mediaTag === mediaTag,
        );
        if (!producer) return;

        return getState(MediasoupMediaProducersConsumersObjectsState).producers[
            producer.producerID
        ];
    },

    getConsumerByPeerIdAndMediaTag: (networkID, peerID, tag) => {
        const state = getState(MediasoupMediaProducerConsumerState)[networkID];
        if (!state) return;

        const consumer = Object.values(state.consumers).find(
            p => p.peerID === peerID && p.mediaTag === tag,
        );
        if (!consumer) return;

        return getState(MediasoupMediaProducersConsumersObjectsState).consumers[
            consumer.consumerID
        ];
    },

    receptors: {
        onProducerCreated: MediasoupMediaProducerActions.producerCreated.receive(action => {
            const state = getMutableState(MediasoupMediaProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) {
                state.merge({ [networkID]: { producers: {}, consumers: {} } });
            }
            state[networkID].producers.merge({
                [action.producerID]: {
                    transportID: action.transportID,
                    producerID: action.producerID,
                    peerID: action.peerID,
                    mediaTag: action.mediaTag,
                    channelID: action.channelID,
                },
            });
        }),

        onProducerClosed: MediasoupMediaProducerActions.producerClosed.receive(action => {
            const networkID = action.$network;
            const state = getMutableState(MediasoupMediaProducerConsumerState);

            state[networkID]?.producers[action.producerID].set(none);

            if (
                !state[networkID]?.producers.keys.length &&
                !state[networkID]?.consumers.keys.length
            ) {
                state[networkID].set(none);
            }
        }),

        onProducerPaused: MediasoupMediaProducerActions.producerPaused.receive(action => {
            const state = getMutableState(MediasoupMediaProducerConsumerState);
            const networkID = action.$network;
            const matchingConsumer = state.value[networkID]
                ? Object.values(state.value[networkID].consumers).find(
                      consumer => consumer.producerID === action.producerID,
                  )
                ;
            if (matchingConsumer)
                state[networkID].consumers[matchingConsumer.consumerID].producerPaused.set(
                    action.paused,
                );
            if (!state.value[networkID]?.producers[action.producerID]) return;

            const producerState = state[networkID].producers[action.producerID];

            producerState.merge({
                paused: action.paused,
                globalMute: action.globalMute,
            });

            const peerID = producerState.peerID.value;
            const mediatag = producerState.mediaTag.value;

            const { globalMute, paused } = action;
            const network = getState(NetworkState).networks[networkID];
            const media = network.peers[peerID]?.media;
            if (media && media[mediatag]) {
                media[mediatag].paused = paused;
                media[mediatag].globalMute = globalMute;
            }
        }),

        onConsumerCreated: MediasoupMediaConsumerActions.consumerCreated.receive(action => {
            const state = getMutableState(MediasoupMediaProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) {
                state.merge({ [networkID]: { producers: {}, consumers: {} } });
            }
            state[networkID].consumers.merge({
                [action.consumerID]: {
                    consumerID: action.consumerID,
                    peerID: action.peerID,
                    mediaTag: action.mediaTag,
                    transportID: action.transportID,
                    channelID: action.channelID,
                    producerID: action.producerID,
                    kind: action.kind,
                    paused: action.paused,
                    producerPaused: action.producerPaused,
                    rtpParameters: action.rtpParameters,
                    type: action.consumerType,
                },
            });
        }),

        onConsumerClosed: MediasoupMediaConsumerActions.consumerClosed.receive(action => {
            const state = getMutableState(MediasoupMediaProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]) return;

            state[networkID].consumers[action.consumerID].set(none);

            if (
                !Object.keys(state[networkID].producers).length &&
                !Object.keys(state[networkID].consumers).length
            ) {
                state[networkID].set(none);
            }
        }),

        onConsumerPaused: MediasoupMediaConsumerActions.consumerPaused.receive(action => {
            const state = getMutableState(MediasoupMediaProducerConsumerState);
            const networkID = action.$network;
            if (!state.value[networkID]?.consumers[action.consumerID]) return;

            state[networkID].consumers[action.consumerID].merge({
                paused: action.paused,
            });
        }),

        onTransportClosed: MediasoupTransportActions.transportClosed.receive(action => {
            const network = action.$network;
            // if the transport is closed, we need to close all producers and consumers for that transport
            const state = getMutableState(MediasoupMediaProducerConsumerState)[network];
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
            const state = getState(MediasoupMediaProducerConsumerState);
            const producers = state[action.$network]?.producers;
            const networkState = getState(NetworkState).networks[action.$network];
            if (!networkState?.ready) return;
            if (producers)
                for (const producer of Object.values(producers)) {
                    const transport =
                        getState(MediasoupTransportState)[action.$network]?.[producer.transportID];
                    if (transport && action.peers.find(peer => peer.peerID === transport.peerID))
                        continue;
                    getMutableState(MediasoupMediaProducerConsumerState)[action.$network].producers[
                        producer.producerID
                    ].set(none);
                }
            const consumers = state[action.$network]?.consumers;
            if (consumers)
                for (const consumer of Object.values(consumers)) {
                    const transport =
                        getState(MediasoupTransportState)[action.$network]?.[consumer.transportID];
                    if (transport && action.peers.find(peer => peer.peerID === transport.peerID))
                        continue;
                    getMutableState(MediasoupMediaProducerConsumerState)[action.$network].consumers[
                        consumer.consumerID
                    ].set(none);
                }
        }),
    },

    reactor: () => {
        const networkIDs = useMutableState(MediasoupMediaProducerConsumerState);
        return (
            <>
                {networkIDs.keys.map(id => (
                    <NetworkReactor key={id} networkID={id} />
                ))}
            </>
        );
    },
});

export const NetworkMediaProducer = props => {
    const { networkID, producerID } = props;
    const producerState = useHookstate(
        getMutableState(MediasoupMediaProducerConsumerState)[networkID].producers[producerID],
    );
    const producerObjectState = useHookstate(
        getMutableState(MediasoupMediaProducersConsumersObjectsState).producers[producerID],
    );
    const transportState = useHookstate(
        getMutableState(MediasoupTransportObjectsState)[producerState.transportID.value],
    );

    useEffect(() => {
        const peerID = producerState.peerID.value;
        const mediaTag = producerState.mediaTag.value;
        const producer = producerObjectState.value;

        if (!producer) return;

        return () => {
            // TODO, for some reason this is triggering more often than it should, so check if it actually has been removed
            if (producer.closed || producer._closed) return;

            producer.close();

            const network = getState(NetworkState).networks[networkID];

            if (!network) return;

            // remove from the peer state
            const media = network.peers[peerID]?.media;
            if (media && media[producer.appData.mediaTag]) {
                delete media[producer.appData.mediaTag];
            }

            const state = getState(MediasoupMediaProducerConsumerState)[networkID];
            if (!state) return;

            const consumer = Object.values(state.consumers).find(
                p => p.peerID === peerID && p.mediaTag === mediaTag,
            );

            // todo, replace this with a better check
            if (consumer) {
                dispatchAction(
                    MediasoupMediaConsumerActions.consumerClosed({
                        consumerID: consumer.consumerID,
                        $topic: network.topic,
                    }),
                );
            }
        };
    }, [producerObjectState.value]);

    useEffect(() => {
        const producer = producerObjectState.value;

        if (!producer) return;

        if (producer.closed || producer._closed) return;

        if (producerState.paused.value && producer.pause) producer.pause();
        if (!producerState.paused.value && producer.resume) producer.resume();
    }, [producerState.paused.value, producerObjectState.value]);

    useEffect(() => {
        if (!transportState.value || !producerObjectState.value) return;
        const producerObject = producerObjectState.get(NO_PROXY_STEALTH);
        return () => {
            producerObject.close();
        };
    }, [transportState.value, producerObjectState.value]);

    const consumer = Object.values(
        getState(MediasoupMediaProducerConsumerState)[networkID].consumers,
    ).find(p => p.producerID === producerID);

    if (!consumer) return null;

    return null;
};

export const NetworkMediaConsumer = props => {
    const { networkID, consumerID } = props;
    const consumerState = useHookstate(
        getMutableState(MediasoupMediaProducerConsumerState)[networkID].consumers[consumerID],
    );
    const consumerObjectState = useHookstate(
        getMutableState(MediasoupMediaProducersConsumersObjectsState).consumers[consumerID],
    );
    const transportState = useHookstate(
        getMutableState(MediasoupTransportObjectsState)[consumerState.transportID.value],
    );

    useEffect(() => {
        const consumer = consumerObjectState.value;
        if (!consumer) return;

        return () => {
            // TODO, for some reason this is triggering more often than it should, so check if it actually has been removed
            if (consumerObjectState.value || consumer.closed || consumer._closed) return;

            const network = getState(NetworkState).networks[networkID];
            consumer.close();
        };
    }, [consumerObjectState]);

    useEffect(() => {
        const consumer = consumerObjectState.value;
        const producerID = consumerState.producerID.value;
        const producer = getState(MediasoupMediaProducersConsumersObjectsState).producers[
            producerID
        ];
        if (
            !consumer ||
            consumer.closed ||
            consumer._closed ||
            !producer ||
            producer?.closed ||
            producer?._closed
        )
            return;

        if (consumerState.paused.value && typeof consumer.pause === "function") consumer.pause();
        if (!consumerState.paused.value && typeof consumer.resume === "function") consumer.resume();
    }, [consumerState.paused, consumerObjectState]);

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
        getMutableState(MediasoupMediaProducerConsumerState)[networkID].producers,
    );
    const consumers = useHookstate(
        getMutableState(MediasoupMediaProducerConsumerState)[networkID].consumers,
    );
    const network = useHookstate(getMutableState(NetworkState).networks[networkID]);

    if (!network.value) return null;

    return (
        <>
            {producers.keys.map(producerID => (
                <NetworkMediaProducer
                    key={producerID}
                    producerID={producerID}
                    networkID={networkID}
                />
            ))}
            {consumers.keys.map(consumerID => (
                <NetworkMediaConsumer
                    key={consumerID}
                    consumerID={consumerID}
                    networkID={networkID}
                />
            ))}
        </>
    );
};
