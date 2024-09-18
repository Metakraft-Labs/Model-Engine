import { encode } from "msgpackr";
import matches from "ts-matches";

import { defineSystem, Engine, PresentationSystemGroup } from "../../ecs";
import {
    defineAction,
    defineActionQueue,
    defineState,
    dispatchAction,
    getMutableState,
    getState,
} from "../../hyperflux";
import {
    DataChannelRegistryState,
    matchesUserID,
    NetworkState,
    NetworkTopics,
    webcamAudioDataChannelType,
    webcamVideoDataChannelType,
} from "../../network";
import { PhysicsSerialization } from "../../spatial/physics/PhysicsSerialization";

import { mocapDataChannelType } from "../mocap/MotionCaptureSystem";

export class ECSRecordingActions {
    static startRecording = defineAction({
        type: "ee.core.motioncapture.START_RECORDING",
        recordingID: matches.string,
    });

    static recordingStarted = defineAction({
        type: "ee.core.motioncapture.RECORDING_STARTED",
        recordingID: matches.string,
    });

    static stopRecording = defineAction({
        type: "ee.core.motioncapture.STOP_RECORDING",
        recordingID: matches.string,
    });

    static startPlayback = defineAction({
        type: "ee.core.motioncapture.PLAY_RECORDING",
        recordingID: matches.string,
        targetUser: matchesUserID.optional(),
        autoplay: matches.boolean,
    });

    static playbackChanged = defineAction({
        type: "ee.core.motioncapture.PLAYBACK_CHANGED",
        recordingID: matches.string,
        playing: matches.boolean,
    });

    static stopPlayback = defineAction({
        type: "ee.core.motioncapture.STOP_PLAYBACK",
        recordingID: matches.string,
    });

    static error = defineAction({
        type: "ee.core.motioncapture.ERROR",
        error: matches.string,
    });
}

export const RecordingState = defineState({
    name: "ee.RecordingState",

    /** @todo - support multiple recording */
    initial: {
        active: false,
        startedAt: null,
        recordingID: null,
    },

    receptors: {
        onStartRecording: ECSRecordingActions.startRecording.receive(_action => {
            const state = getMutableState(RecordingState);
            state.active.set(true);
            state.startedAt.set(null);
            state.recordingID.set(null);
        }),
        onRecordingStarted: ECSRecordingActions.recordingStarted.receive(action => {
            const state = getMutableState(RecordingState);
            state.startedAt.set(Date.now());
            state.recordingID.set(action.recordingID);
        }),
        onStopRecording: ECSRecordingActions.stopRecording.receive(_action => {
            const state = getMutableState(RecordingState);
            state.active.set(false);
            state.startedAt.set(null);
            state.recordingID.set(null);
        }),
        onError: ECSRecordingActions.error.receive(_action => {
            const state = getMutableState(RecordingState);
            state.active.set(false);
            state.startedAt.set(null);
            state.recordingID.set(null);
        }),
    },

    requestRecording: async peerSchema => {
        try {
            const userSchema = [];
            if (peerSchema.user.Avatar) userSchema.push(PhysicsSerialization.ID);

            const schema = {
                user: userSchema,
                peers: {},
            };

            if (peerSchema.user.Avatar) schema;

            Object.entries(peerSchema.peers).forEach(([peerID, value]) => {
                const peerSchema = [];
                if (value.Mocap) peerSchema.push(mocapDataChannelType);
                if (value.Video) peerSchema.push(webcamVideoDataChannelType);
                if (value.Audio) peerSchema.push(webcamAudioDataChannelType);
                if (peerSchema.length) schema.peers[peerID] = peerSchema;
            });

            // const recording = await API.instance.service(recordingPath).create({ schema: schema });

            // if (recording.id) RecordingState.startRecording({ recordingID: recording.id });
        } catch (err) {
            console.error(err);
            // NotificationService.dispatchNotify(err.message, { variant: 'error' })
        }
    },

    startRecording(args) {
        const { recordingID } = args;
        const action = ECSRecordingActions.startRecording({
            recordingID,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.world,
            $to: NetworkState.worldNetwork.hostPeerID,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.media,
            $to: NetworkState.mediaNetwork.hostPeerID,
        });
    },

    stopRecording(args) {
        const recording = ECSRecordingActions.stopRecording({
            recordingID: args.recordingID,
        });
        dispatchAction({
            ...recording,
            $topic: NetworkTopics.world,
            $to: NetworkState.worldNetwork.hostPeerID,
        });
        // todo - check that video actually needs to be stopped
        dispatchAction({
            ...recording,
            $topic: NetworkTopics.media,
            $to: NetworkState.mediaNetwork.hostPeerID,
        });
    },
});

export const PlaybackState = defineState({
    name: "ee.PlaybackState",

    /** @todo - support multiple playback */
    initial: {
        recordingID: null,
        playing: false,
        currentTime: null,
    },

    receptors: {
        onPlaybackChanged: ECSRecordingActions.playbackChanged.receive(action => {
            const state = getMutableState(PlaybackState);
            state.playing.set(action.playing);
            state.recordingID.set(action.playing ? action.recordingID : null);
            state.currentTime.set(action.playing ? 0 : null);
        }),
    },

    startPlaybackOnServer(args) {
        const { recordingID, targetUser } = args;
        const action = ECSRecordingActions.startPlayback({
            recordingID,
            targetUser,
            autoplay: false,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.world,
            $to: NetworkState.worldNetwork.hostPeerID,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.media,
            $to: NetworkState.mediaNetwork.hostPeerID,
        });
    },

    stopPlaybackOnServer(args) {
        const { recordingID } = args;
        const action = ECSRecordingActions.stopPlayback({
            recordingID,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.world,
            $to: NetworkState.worldNetwork.hostPeerID,
        });

        dispatchAction({
            ...action,
            $topic: NetworkTopics.media,
            $to: NetworkState.mediaNetwork.hostPeerID,
        });
    },
});

export const RecordingAPIState = defineState({
    name: "ee.engine.recording.RecordingAPIState",
    initial: {
        createMediaChannelRecorder: null | MediaChannelRecorderType,
        uploadRecordingChunk: null | UploadRecordingChunkType,
    },
});

/** @deprecated @todo merge with RecordingService */
export const activeRecordings = new Map();
/** @deprecated @todo merge with RecordingService */
export const activePlaybacks = new Map();

export const dispatchError = (error, targetPeer, topic) => {
    console.error("Recording Error: " + error);
    dispatchAction(ECSRecordingActions.error({ error, $to: targetPeer, $topic: topic }));
};

export const onStartRecording = async _action => {
    // // const api = API.instance;
    // // const recording = await api.service(recordingPath).get(action.recordingID);
    // // if (!recording) return dispatchError("Recording not found", action.$peer, action.$topic);
    // // let schema = recording.schema;
    // // if (typeof schema === "string") {
    // //     schema = JSON.parse(schema);
    // // }
    // // const user = await api.service(userPath).get(recording.userId);
    // // if (!user) return dispatchError("Invalid user", action.$peer, action.$topic);
    // // const userID = user.id;
    // // const hasScopes = await checkScope(user, "recording", "write");
    // // if (!hasScopes)
    // //     return dispatchError("User does not have record:write scope", action.$peer, action.$topic);
    // const dataChannelsRecording = new Map();
    // const startTime = Date.now();
    // const chunkLength = Math.floor((1000 / getState(ECSState).simulationTimestep) * 60); // 1 minute
    // const dataChannelRecorder = (_network, dataChannel, fromPeerID, message) => {
    //     try {
    //         const data = decode(new Uint8Array(message));
    //         if (!dataChannelsRecording.has(dataChannel)) {
    //             dataChannelsRecording.set(dataChannel, { fromPeerID, frames: [] });
    //         }
    //         dataChannelsRecording
    //             .get(dataChannel)
    //             .frames.push({ data, timecode: Date.now() - startTime });
    //     } catch (error) {
    //         console.error("Could not decode data channel message", error);
    //     }
    // };
    // const activeRecording = {
    //     userID,
    //     dataChannelRecorder,
    // };
    // const uploadRecordingChunk = getState(RecordingAPIState).uploadRecordingChunk;
    // if (!uploadRecordingChunk)
    //     return dispatchError(
    //         "Recording not available - no upload method provided",
    //         action.$peer,
    //         action.$topic,
    //     );
    // if (NetworkState.worldNetwork) {
    //     const serializationSchema = schema.user
    //         .map(component => getState(NetworkState).networkSchema[component])
    //         .filter(Boolean);
    //     activeRecording.serializer = ECSSerialization.createSerializer({
    //         entities: () => {
    //             return [AvatarComponent.getUserAvatarEntity(userID)];
    //         },
    //         schema: serializationSchema,
    //         chunkLength,
    //         onCommitChunk(chunk, chunkIndex) {
    //             const key = "recordings/" + recording.id + "/entities-" + chunkIndex + ".ee";
    //             const buffer = encode(chunk);
    //             uploadRecordingChunk({
    //                 recordingID: recording.id,
    //                 key,
    //                 body: buffer,
    //                 mimeType: "application/octet-stream",
    //             }).then(() => {
    //                 console.info("Uploaded entities chunk", chunkIndex);
    //             });
    //             for (const [dataChannel, data] of dataChannelsRecording.entries()) {
    //                 if (data.frames.length) {
    //                     const key =
    //                         "recordings/" +
    //                         recording.id +
    //                         "/" +
    //                         data.fromPeerID +
    //                         "_" +
    //                         dataChannel +
    //                         "_" +
    //                         chunkIndex +
    //                         ".ee";
    //                     const buffer = encode(data);
    //                     uploadRecordingChunk({
    //                         recordingID: recording.id,
    //                         key,
    //                         body: buffer,
    //                         mimeType: "application/octet-stream",
    //                     }).then(() => {
    //                         console.info("Uploaded raw chunk", chunkIndex);
    //                     });
    //                 }
    //                 data.frames = [];
    //             }
    //         },
    //     });
    //     // activeRecording.serializer.active = true
    //     const dataChannelSchema = Object.values(schema.peers)
    //         .flat()
    //         .filter(component => !!getState(DataChannelRegistryState)[component])
    //         .filter(Boolean);
    //     for (const dataChannel of dataChannelSchema) {
    //         addDataChannelHandler(dataChannel, dataChannelRecorder);
    //     }
    // }
    // if (NetworkState.mediaNetwork) {
    //     const createMediaRecording = getState(RecordingAPIState).createMediaChannelRecorder;
    //     if (!createMediaRecording)
    //         return dispatchError("Media recording not available", action.$peer, action.$topic);
    //     try {
    //         activeRecording.mediaChannelRecorder = await createMediaRecording(
    //             recording.id,
    //             schema.peers,
    //         );
    //         dispatchAction(
    //             ECSRecordingActions.recordingStarted({
    //                 recordingID: recording.id,
    //                 $to: action.$peer,
    //                 $topic: action.$topic,
    //             }),
    //         );
    //     } catch (e) {
    //         console.error("Could not start media recording");
    //         console.log(e);
    //         dispatchError("Could not start media recording", action.$peer, action.$topic);
    //     }
    // }
    // activeRecordings.set(recording.id, activeRecording);
};

export const onStopRecording = async _action => {
    // const api = API.instance;
    // const activeRecording = activeRecordings.get(action.recordingID);
    // if (!activeRecording) return dispatchError("Recording not found", action.$peer, action.$topic);
    // const user = await api.service(userPath).get(activeRecording.userID);
    // const hasScopes = await checkScope(user, "recording", "write");
    // if (!hasScopes)
    //     return dispatchError("User does not have record:write scope", action.$peer, action.$topic);
    // api.service(recordingPath).patch(action.recordingID, { ended: true }, { isInternal: true });
    // const recording = await api.service(recordingPath).get(action.recordingID);
    // let schema = recording.schema;
    // if (typeof schema === "string") {
    //     schema = JSON.parse(schema);
    // }
    // if (activeRecording.serializer) {
    //     activeRecording.serializer.end();
    // }
    // if (activeRecording.mediaChannelRecorder) {
    //     await Promise.all([
    //         ...activeRecording.mediaChannelRecorder.recordings.map(recording =>
    //             recording.stopRecording(),
    //         ),
    //         ...activeRecording.mediaChannelRecorder.activeUploads,
    //     ]);
    //     // stop recording data channel
    // }
    // if (activeRecording.dataChannelRecorder) {
    //     const dataChannelSchema = Object.values(schema.peers)
    //         .flat()
    //         .filter(component => !!getState(DataChannelRegistryState)[component])
    //         .filter(Boolean);
    //     for (const dataChannel of dataChannelSchema) {
    //         removeDataChannelHandler(dataChannel, activeRecording.dataChannelRecorder);
    //     }
    // }
    // activeRecordings.delete(action.recordingID);
};

export const onStartPlayback = async _action => {
    // const api = API.instance;
    // const recording = await api
    //     .service(recordingPath)
    //     .get(action.recordingID, { isInternal: true });
    // let schema = recording.schema;
    // if (typeof schema === "string") {
    //     schema = JSON.parse(schema);
    // }
    // const isClone = !action.targetUser;
    // const user = await api.service(userPath).get(recording.userId);
    // if (!user) return dispatchError("User not found", action.$peer, action.$topic);
    // if (
    //     !isClone &&
    //     Array.from(activePlaybacks.values()).find(rec => rec.userID === action.targetUser)
    // ) {
    //     return dispatchError("User already has an active playback", action.$peer, action.$topic);
    // }
    // const hasScopes = await checkScope(user, "recording", "read");
    // if (!hasScopes)
    //     return dispatchError("User does not have record:read scope", action.$peer, action.$topic);
    // if (!recording.resources?.length)
    //     return dispatchError("Recording has no resources", action.$peer, action.$topic);
    // const entityFiles = recording.resources.filter(resource => resource.key.includes("entities-"));
    // const rawFiles = recording.resources.filter(
    //     resource =>
    //         !resource.key.includes("entities-") &&
    //         resource.key.substring(resource.key.length - 3, resource.key.length) === ".ee",
    // );
    // const entityChunks = await Promise.all(
    //     entityFiles.map(async resource => {
    //         const data = await fetch(resource.url);
    //         const buffer = await data.arrayBuffer();
    //         return decode(new Uint8Array(buffer));
    //     }),
    // );
    // const dataChannelChunks = new Map();
    // await Promise.all(
    //     rawFiles.map(async resource => {
    //         const keyPieces = resource.key.split("/")[2].split("_");
    //         const fromPeerID = keyPieces[0];
    //         const dataChannel = keyPieces[1];
    //         if (!dataChannelChunks.has(dataChannel))
    //             dataChannelChunks.set(dataChannel, { fromPeerID, frames: [] });
    //         const data = await fetch(resource.url);
    //         const buffer = await data.arrayBuffer();
    //         const decodedData = decode(new Uint8Array(buffer));
    //         dataChannelChunks.get(dataChannel).frames.push(...decodedData.frames);
    //     }),
    // );
    // const startTime = new Date(recording.createdAt).getTime();
    // const endTime = new Date(recording.updatedAt).getTime();
    // const durationSeconds = (endTime - startTime) / 1000;
    // const activePlayback = {
    //     userID: action.targetUser,
    //     entityChunks,
    //     dataChannelChunks,
    //     startTime,
    //     endTime,
    //     durationSeconds,
    // };
    // const network = getState(NetworkState).networks[action.$network];
    // const entitiesSpawned = [];
    // activePlayback.deserializer = ECSSerialization.createDeserializer({
    //     id: recording.id,
    //     chunks: entityChunks,
    //     schema: schema.user
    //         .map(component => getState(NetworkState).networkSchema[component])
    //         .filter(Boolean),
    //     onChunkStarted: chunkIndex => {
    //         if (!entityChunks[chunkIndex]) return;
    //         for (let i = 0; i < entityChunks[chunkIndex].entities.length; i++) {
    //             const uuid = entityChunks[chunkIndex].entities[i];
    //             // entity ID such that it is actually unique, by appendig the recording id
    //             const entityID =
    //                 (isClone ? uuid + "_" + recording.id : uuid) ?? Engine.instance.userID;
    //             entityChunks[chunkIndex].entities[i] = entityID;
    //             api.service(userPath)
    //                 .get(uuid)
    //                 .then(user => {
    //                     if (network && network.topic === NetworkTopics.world) {
    //                         const network = NetworkState.worldNetwork;
    //                         const peerIDs = Object.keys(schema.peers);
    //                         // todo, this is a hack
    //                         for (const peerID of peerIDs) {
    //                             if (network.peers[peerID]) continue;
    //                             activePlayback.peerIDs.push(peerID);
    //                             NetworkPeerFunctions.createPeer(
    //                                 network,
    //                                 peerID,
    //                                 network.peerIndexCount++,
    //                                 entityID,
    //                                 network.userIndexCount++,
    //                             );
    //                             updatePeers(network);
    //                         }
    //                     }
    //                     if (!UUIDComponent.getEntityByUUID(entityID) && isClone) {
    //                         dispatchAction(
    //                             AvatarNetworkAction.spawn({
    //                                 parentUUID: getComponent(
    //                                     Engine.instance.originEntity,
    //                                     UUIDComponent,
    //                                 ),
    //                                 ownerID: entityID,
    //                                 entityUUID: entityID + "_avatar",
    //                                 avatarID: user.avatar.id,
    //                                 name: user.name + "'s Clone",
    //                             }),
    //                         );
    //                         entitiesSpawned.push(entityID);
    //                     }
    //                 })
    //                 .catch(e => {
    //                     // console.log('not a user', e)
    //                 });
    //         }
    //     },
    //     onEnd: () => {
    //         playbackStopped(activePlayback.userID, recording.id, network);
    //     },
    // });
    // // activePlayback.deserializer.active = action.autoplay
    // activePlayback.entitiesSpawned = entitiesSpawned;
    // activePlayback.peerIDs = [];
    // activePlaybacks.set(action.recordingID, activePlayback);
    // /** We only need to dispatch once, so do it on the media server which takes longer to start */
    // if (!network || network.topic === NetworkTopics.media) {
    //     dispatchAction(
    //         ECSRecordingActions.playbackChanged({
    //             recordingID: action.recordingID,
    //             playing: true,
    //             $topic: network?.topic,
    //         }),
    //     );
    // }
};

export const onStopPlayback = async _action => {
    // const api = API.instance;
    // const recording = await api.service(recordingPath).get(action.recordingID);
    // let schema = recording.schema;
    // if (typeof schema === "string") {
    //     schema = JSON.parse(schema);
    // }
    // const user = await api.service(userPath).get(recording.userId);
    // const hasScopes = await checkScope(user, "recording", "read");
    // if (!hasScopes) throw new Error("User does not have record:read scope");
    // const activePlayback = activePlaybacks.get(action.recordingID);
    // if (!activePlayback) return;
    // if (activePlayback.deserializer) {
    //     activePlayback.deserializer.end();
    // }
    // if (activePlayback.mediaPlayback) {
    //     /** @todo */
    // }
    // playbackStopped(user.id, recording.id, getState(NetworkState).networks[action.$network]);
};

// const playbackStopped = (_userId, recordingID, network) => {
//     const activePlayback = activePlaybacks.get(recordingID);

//     for (const entityUUID of activePlayback.entitiesSpawned) {
//         dispatchAction(
//             WorldNetworkAction.destroyEntity({
//                 entityUUID: entityUUID,
//             }),
//         );
//     }

//     if (network) {
//         if (activePlayback.peerIDs) {
//             for (const peerID of activePlayback.peerIDs) {
//                 NetworkPeerFunctions.destroyPeer(network, peerID);
//             }
//         }

//         updatePeers(network);

//         /** If syncing multipile instance servers, only need to dispatch once, so do it on the world server */
//         if (network.topic === NetworkTopics.world) {
//             dispatchAction(
//                 ECSRecordingActions.playbackChanged({
//                     recordingID,
//                     playing: false,
//                     $topic: network.topic,
//                 }),
//             );
//         }
//     } else {
//         dispatchAction(
//             ECSRecordingActions.playbackChanged({
//                 recordingID,
//                 playing: false,
//             }),
//         );
//     }

//     activePlaybacks.delete(recordingID);
// };

// const startRecordingActionQueue = defineActionQueue(ECSRecordingActions.startRecording.matches);
// const stopRecordingActionQueue = defineActionQueue(ECSRecordingActions.stopRecording.matches);
const startPlaybackActionQueue = defineActionQueue(ECSRecordingActions.startPlayback.matches);
const stopPlaybackActionQueue = defineActionQueue(ECSRecordingActions.stopPlayback.matches);

const execute = () => {
    const recordingState = getState(RecordingState);
    const playbackState = getState(PlaybackState);

    for (const action of startPlaybackActionQueue()) onStartPlayback(action);
    for (const action of stopPlaybackActionQueue()) onStopPlayback(action);

    // todo - only set deserializer.active to true once avatar spawns, if clone mode

    const network = NetworkState.worldNetwork; // TODO - support buffer playback in media server

    if (!network) return;

    if (recordingState.active) {
        for (const [_id, recording] of activeRecordings) {
            const { serializer } = recording;
            if (serializer) {
                serializer.write();
            }
        }
    }

    if (playbackState.playing) {
        const activePlayback = activePlaybacks.get(playbackState.recordingID);
        /** @todo use playback speed from metadata in recording */
        const timestep = 1 / 60; // TODO this is hardcoded in server timer
        getMutableState(PlaybackState).currentTime.set(playbackState.currentTime + timestep);

        if (playbackState.currentTime >= activePlayback.durationSeconds) {
            getMutableState(PlaybackState).playing.set(false);
        }
    }

    for (const [_id, playback] of activePlaybacks) {
        const { deserializer } = playback;
        const currentTime = playbackState.currentTime;
        const chunkLength = playback.entityChunks[0].changes.length;

        const chunkIndex = Math.floor(currentTime / chunkLength);
        const frameIndex = Math.floor(currentTime * 60) % chunkLength;

        if (deserializer) {
            deserializer.read(chunkIndex, frameIndex);
        }

        for (const [dataChannel, chunks] of Array.from(playback.dataChannelChunks.entries())) {
            /** @todo optimize this by caching a coherent timeseries map of timecodes */
            const currentTimeMS = currentTime * 1000;
            /** @todo reengineer chunking with seeking */
            const frame = chunks.frames.find(frame => frame.timecode > currentTimeMS);
            if (frame) {
                const encodedData = encode(frame.data);

                /** PeerID must be the original peerID if server playback, otherwise it is our peerID */
                const peerID = Engine.instance.store.peerID;
                const dataChannelFunctions = getState(DataChannelRegistryState)[dataChannel];
                if (dataChannelFunctions) {
                    for (const func of dataChannelFunctions)
                        func(network, dataChannel, peerID, encodedData);
                }
                network.bufferToAll(dataChannel, peerID, encodedData);
            }
        }
        // }
    }
};

export const ECSRecordingSystem = defineSystem({
    uuid: "ee.engine.ECSRecordingSystem",
    insert: { after: PresentationSystemGroup },
    execute,
});
