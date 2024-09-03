import { VRMHumanBoneName } from "@pixiv/three-vrm";
import { Not } from "bitecs";
import React, { useEffect } from "react";
import { Vector3 } from "three";

import { getComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { defineQuery, QueryReactor } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../../ecs/SystemGroups";
import { MediaSettingsState } from "../../../engine/audio/MediaSettingsState";
import { getMutableState, getState, useHookstate } from "../../../hyperflux";
import {
    MediasoupMediaProducerConsumerState,
    MediasoupMediaProducersConsumersObjectsState,
    NetworkObjectComponent,
    NetworkObjectOwnedTag,
    NetworkState,
    webcamAudioDataChannelType,
} from "../../../network";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { EngineState } from "../../../spatial/EngineState";
import { AvatarComponent } from "../../avatar/components/AvatarComponent";
import { getAvatarBoneWorldPosition } from "../../avatar/functions/avatarFunctions";
import {
    AudioNodeGroups,
    createAudioNodeGroup,
    MediaElementComponent,
} from "../../scene/components/MediaComponent";
import { AudioState } from "../AudioState";
import { PositionalAudioComponent } from "../components/PositionalAudioComponent";
import { addPannerNode, removePannerNode, updateAudioPanner } from "../PositionalAudioFunctions";

const _vec3 = new Vector3();
const _rot = new Vector3();

/**
 * Scene Objects
 */
const positionalAudioQuery = defineQuery([
    PositionalAudioComponent,
    MediaElementComponent,
    TransformComponent,
]);

/**
 * Avatars
 */
const networkedAvatarAudioQuery = defineQuery([
    AvatarComponent,
    NetworkObjectComponent,
    Not(NetworkObjectOwnedTag),
]);

/** Weak map entry is automatically GC'd when network object is removed */
const avatarAudioStreams = new WeakMap();

const execute = () => {
    const audioState = getState(AudioState);
    const audioContext = audioState.audioContext;
    if (!audioContext) return;

    const network = NetworkState.mediaNetwork;
    const mediaSettings = getState(MediaSettingsState);
    const immersiveMedia = mediaSettings.immersiveMedia;

    /**
     * Scene Objects
     */

    /**
     * No need to update pose of positional audio objects if the audio context is not running
     */
    if (audioContext.state !== "running") return;

    /**
     * Avatars
     * lazily detect when consumers are created and destroyed
     */
    const networkedAvatarAudioEntities = networkedAvatarAudioQuery();
    for (const entity of networkedAvatarAudioEntities) {
        if (!network) continue;
        const networkObject = getComponent(entity, NetworkObjectComponent);
        const ownerID = networkObject.ownerId;
        const peers = Object.values(network.peers).filter(peer => peer.userId === ownerID);
        const consumers = getState(MediasoupMediaProducerConsumerState)[network.id]?.consumers;

        if (!consumers) continue;

        const consumerState = Object.values(consumers).find(
            c =>
                c.mediaTag === webcamAudioDataChannelType &&
                peers.find(peer => c.peerID === peer.peerID),
        );

        const consumer =
            consumerState &&
            getState(MediasoupMediaProducersConsumersObjectsState).consumers[
                consumerState.consumerID
            ];

        // avatar still exists but audio stream does not
        if (consumer) {
            if (avatarAudioStreams.has(networkObject)) avatarAudioStreams.delete(networkObject);
            continue;
        }

        const existingAudioObj = avatarAudioStreams.get(networkObject);

        if (existingAudioObj) {
            // only force positional audio for avatar media streams in XR
            const audioNodes = AudioNodeGroups.get(existingAudioObj);
            if (audioNodes.panner && !immersiveMedia) removePannerNode(audioNodes);
            else if (!audioNodes.panner && immersiveMedia) addPannerNode(audioNodes, mediaSettings);

            // audio stream exists and has already been handled
            continue;
        }

        // get existing stream - need to wait for UserWindowMedia to populate
        const existingAudioObject = document.getElementById(`${ownerID}_audio`);
        if (!existingAudioObject) continue;

        // mute existing stream
        existingAudioObject.muted = true;
        // todo, refactor this out of event listener
        existingAudioObject.addEventListener("volumechange", () => {
            audioNodes.gain.gain.setTargetAtTime(
                existingAudioObject.volume,
                audioContext.currentTime,
                0.01,
            );
        });

        // audio streams exists but has not been handled
        const mediaTrack = consumer.track;
        const stream = new MediaStream([mediaTrack.clone()]);

        const audioNodes = createAudioNodeGroup(
            stream,
            audioContext.createMediaStreamSource(stream),
            audioState.gainNodeMixBuses.mediaStreams,
        );
        audioNodes.gain.gain.setTargetAtTime(
            existingAudioObject.volume,
            audioContext.currentTime,
            0.01,
        );

        if (immersiveMedia) addPannerNode(audioNodes, mediaSettings);

        avatarAudioStreams.set(networkObject, stream);
    }

    const endTime = audioContext.currentTime + getState(ECSState).deltaSeconds;

    /**
     * Update panner nodes
     */
    for (const entity of positionalAudioQuery()) {
        const element = getComponent(entity, MediaElementComponent).element;
        const { position, rotation } = getComponent(entity, TransformComponent);
        const positionalAudio = getComponent(entity, PositionalAudioComponent);
        const audioObject = AudioNodeGroups.get(element);
        audioObject.panner &&
            updateAudioPanner(audioObject.panner, position, rotation, endTime, positionalAudio);
    }

    /** @todo, only apply this to closest 8 (configurable) avatars #7261 */

    for (const entity of networkedAvatarAudioEntities) {
        const networkObject = getComponent(entity, NetworkObjectComponent);

        const audioObj = avatarAudioStreams.get(networkObject);
        if (!audioObj) continue;

        const panner = AudioNodeGroups.get(audioObj)?.panner;
        if (!panner) continue;

        getAvatarBoneWorldPosition(entity, VRMHumanBoneName.Head, _vec3);
        const { rotation } = getComponent(entity, TransformComponent);

        updateAudioPanner(panner, _vec3, rotation, endTime, mediaSettings);
    }

    const viewerEntity = getState(EngineState).viewerEntity;
    if (!viewerEntity) return;

    /**
     * Update camera listener position
     */
    const { position, rotation } = getComponent(viewerEntity, TransformComponent);
    if (isNaN(position.x)) return;
    _rot.set(0, 0, -1).applyQuaternion(rotation);
    if (isNaN(_rot.x)) return;
    // firefox only supports the deprecated API
    if (!audioContext.listener.positionX) {
        audioContext.listener.setPosition(position.x, position.y, position.z);
        audioContext.listener.setOrientation(_rot.x, _rot.y, _rot.z, 0, 1, 0);
        return;
    }
    audioContext.listener.positionX.linearRampToValueAtTime(position.x, endTime);
    audioContext.listener.positionY.linearRampToValueAtTime(position.y, endTime);
    audioContext.listener.positionZ.linearRampToValueAtTime(position.z, endTime);
    audioContext.listener.forwardX.linearRampToValueAtTime(_rot.x, endTime);
    audioContext.listener.forwardY.linearRampToValueAtTime(_rot.y, endTime);
    audioContext.listener.forwardZ.linearRampToValueAtTime(_rot.z, endTime);

    /** @todo support different world ups */
    // audioContext.listener.upX.linearRampToValueAtTime(camera.up.x, endTime)
    // audioContext.listener.upY.linearRampToValueAtTime(camera.up.y, endTime)
    // audioContext.listener.upZ.linearRampToValueAtTime(camera.up.z, endTime)
};

function PositionalAudioPannerReactor() {
    const entity = useEntityContext();
    const mediaElement = useComponent(entity, MediaElementComponent);
    const positionalAudio = useComponent(entity, PositionalAudioComponent);

    useEffect(() => {
        const audioGroup = AudioNodeGroups.get(mediaElement.element.value); // is it safe to assume this?
        addPannerNode(audioGroup, positionalAudio.value);
        return () => removePannerNode(audioGroup);
    }, [mediaElement, positionalAudio]);

    return null;
}

const reactor = () => {
    const mediaStreamVolume = useHookstate(getMutableState(AudioState).mediaStreamVolume);

    /**
     * Update avatar volume when the value is changed
     */
    useEffect(() => {
        const audioContext = getState(AudioState).audioContext;

        for (const entity of networkedAvatarAudioQuery()) {
            const networkObject = getComponent(entity, NetworkObjectComponent);
            const audioObj = avatarAudioStreams.get(networkObject);
            if (!audioObj) continue;
            const gain = AudioNodeGroups.get(audioObj)?.gain;
            if (gain)
                gain.gain.setTargetAtTime(mediaStreamVolume.value, audioContext.currentTime, 0.01);
        }
    }, [mediaStreamVolume]);

    return (
        <QueryReactor
            Components={[PositionalAudioComponent, TransformComponent]}
            ChildEntityReactor={PositionalAudioPannerReactor}
        />
    );
};

export const PositionalAudioSystem = defineSystem({
    uuid: "ee.engine.PositionalAudioSystem",
    insert: { after: PresentationSystemGroup },
    execute,
    reactor,
});
