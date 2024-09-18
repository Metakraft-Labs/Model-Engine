import { useEffect } from "react";

import {
    defineComponent,
    getOptionalComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import {
    AudioNodeGroups,
    MediaElementComponent,
} from "../../../engine/scene/components/MediaComponent";
import { getMutableState, useHookstate } from "../../../hyperflux/StateFunctions";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { RendererState } from "../../../spatial/renderer/RendererState";

import { PositionalAudioHelperComponent } from "./PositionalAudioHelperComponent";

export const PositionalAudioComponent = defineComponent({
    name: "EE_positionalAudio",

    jsonID: "EE_audio",

    onInit: _entity => {
        return {
            // default values as suggested at https://medium.com/@kfarr/understanding-web-audio-api-positional-audio-distance-models-for-webxr-e77998afcdff
            distanceModel: "inverse",
            rolloffFactor: 3,
            refDistance: 1,
            maxDistance: 40,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (
            typeof json.distanceModel === "string" &&
            component.distanceModel.value !== json.distanceModel
        )
            component.distanceModel.set(json.distanceModel);
        if (
            typeof json.rolloffFactor === "number" &&
            component.rolloffFactor.value !== json.rolloffFactor
        )
            component.rolloffFactor.set(json.rolloffFactor);
        if (
            typeof json.refDistance === "number" &&
            component.refDistance.value !== json.refDistance
        )
            component.refDistance.set(json.refDistance);
        if (
            typeof json.maxDistance === "number" &&
            component.maxDistance.value !== json.maxDistance
        )
            component.maxDistance.set(json.maxDistance);
        if (
            typeof json.coneInnerAngle === "number" &&
            component.coneInnerAngle.value !== json.coneInnerAngle
        )
            component.coneInnerAngle.set(json.coneInnerAngle);
        if (
            typeof json.coneOuterAngle === "number" &&
            component.coneOuterAngle.value !== json.coneOuterAngle
        )
            component.coneOuterAngle.set(json.coneOuterAngle);
        if (
            typeof json.coneOuterGain === "number" &&
            component.coneOuterGain.value !== json.coneOuterGain
        )
            component.coneOuterGain.set(json.coneOuterGain);
    },

    toJSON: (_entity, component) => {
        return {
            distanceModel: component.distanceModel.value,
            rolloffFactor: component.rolloffFactor.value,
            refDistance: component.refDistance.value,
            maxDistance: component.maxDistance.value,
            coneInnerAngle: component.coneInnerAngle.value,
            coneOuterAngle: component.coneOuterAngle.value,
            coneOuterGain: component.coneOuterGain.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const audio = useComponent(entity, PositionalAudioComponent);
        const mediaElement = useOptionalComponent(entity, MediaElementComponent);

        useEffect(() => {
            if (debugEnabled.value) {
                if (!mediaElement || !mediaElement.element.value) return;
                const audioNodes = AudioNodeGroups.get(mediaElement.element.value);
                if (!audioNodes) return;
                const name = getOptionalComponent(entity, NameComponent);
                setComponent(entity, PositionalAudioHelperComponent, {
                    audio: audioNodes,
                    name: name ? `${name}-positional-audio-helper` : null,
                });
            }

            return () => {
                removeComponent(entity, PositionalAudioHelperComponent);
            };
        }, [debugEnabled, mediaElement?.element]);

        useEffect(() => {
            if (!mediaElement?.element.value) return;
            const audioNodes = AudioNodeGroups.get(mediaElement.element.value);
            if (!audioNodes?.panner) return;
            audioNodes.panner.refDistance = audio.refDistance.value;
            audioNodes.panner.rolloffFactor = audio.rolloffFactor.value;
            audioNodes.panner.maxDistance = audio.maxDistance.value;
            audioNodes.panner.distanceModel = audio.distanceModel.value;
            audioNodes.panner.coneInnerAngle = audio.coneInnerAngle.value;
            audioNodes.panner.coneOuterAngle = audio.coneOuterAngle.value;
            audioNodes.panner.coneOuterGain = audio.coneOuterGain.value;
        }, [
            audio.refDistance,
            audio.rolloffFactor,
            audio.maxDistance,
            audio.distanceModel,
            audio.coneInnerAngle,
            audio.coneOuterAngle,
            audio.coneOuterGain,
        ]);

        return null;
    },
});
