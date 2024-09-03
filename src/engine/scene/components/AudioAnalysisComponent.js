import { useEffect } from "react";

import {
    defineComponent,
    setComponent,
    useComponent,
    useEntityContext,
    useOptionalComponent,
} from "../../../ecs";
import { TransformComponent } from "../../../spatial";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";

import { PositionalAudioComponent } from "../../audio/components/PositionalAudioComponent";
import { AudioNodeGroups, MediaComponent, MediaElementComponent } from "./MediaComponent";

export const AudioAnalysisComponent = defineComponent({
    name: "EE_audio_analyzer",
    jsonID: "audio-analyzer",

    onInit: entity => {
        return {
            src: "",
            session,
            bassEnabled: true,
            midEnabled: true,
            trebleEnabled: true,
            bassMultiplier: 1,
            midMultiplier: 1,
            trebleMultiplier: 1,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (typeof json.src === "string" && component.src.value !== json.src) {
            component.src.set(json.src);
        }
        if (
            typeof json.bassEnabled === "boolean" &&
            component.bassEnabled.value !== json.bassEnabled
        ) {
            component.bassEnabled.set(json.bassEnabled);
        }
        if (
            typeof json.midEnabled === "boolean" &&
            component.midEnabled.value !== json.midEnabled
        ) {
            component.midEnabled.set(json.midEnabled);
        }
        if (
            typeof json.trebleEnabled === "boolean" &&
            component.trebleEnabled.value !== json.trebleEnabled
        ) {
            component.trebleEnabled.set(json.trebleEnabled);
        }
        if (
            typeof json.bassMultiplier === "number" &&
            component.bassMultiplier.value !== json.bassMultiplier
        ) {
            component.bassMultiplier.set(json.bassMultiplier);
        }
        if (
            typeof json.midMultiplier === "number" &&
            component.midMultiplier.value !== json.midMultiplier
        ) {
            component.midMultiplier.set(json.midMultiplier);
        }
        if (
            typeof json.trebleMultiplier === "number" &&
            component.trebleMultiplier.value !== json.trebleMultiplier
        ) {
            component.trebleMultiplier.set(json.trebleMultiplier);
        }
    },

    toJSON: (entity, component) => {
        return {
            src: component.src.value,
            bassEnabled: component.bassEnabled.value,
            midEnabled: component.midEnabled.value,
            trebleEnabled: component.trebleEnabled.value,
            bassMultiplier: component.bassMultiplier.value,
            midMultiplier: component.midMultiplier.value,
            trebleMultiplier: component.trebleMultiplier.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const audioAnaylsisComponent = useComponent(entity, AudioAnalysisComponent);
        const posAudio = useOptionalComponent(entity, PositionalAudioComponent);
        const mediaElement = useOptionalComponent(entity, MediaElementComponent);
        const existingSystem = useComponent(entity, MediaComponent);

        useEffect(() => {
            setComponent(entity, VisibleComponent);
            setComponent(entity, NameComponent, "AudioAnalysis");
            setComponent(entity, TransformComponent);
        }, []);

        useEffect(() => {
            audioAnaylsisComponent.src.set(existingSystem?.path.values[0]);
        }, [existingSystem.path]);

        useEffect(() => {
            if (!posAudio || !mediaElement?.value.element) return;

            const element = mediaElement.value.element;
            element.onplay = () => {
                const audioObject = AudioNodeGroups.get(element);

                if (audioObject) {
                    const audioContext = audioObject.source.context;
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 2 ** 5;
                    audioObject.source.connect(analyser);
                    audioAnaylsisComponent.session.set({
                        analyser,
                        frequencyData: new Uint8Array(analyser.frequencyBinCount),
                    });
                }
            };
        }, [audioAnaylsisComponent, posAudio, mediaElement]);

        return null;
    },
});
