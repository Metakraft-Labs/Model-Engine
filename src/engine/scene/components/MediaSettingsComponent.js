import { useEffect } from "react";

import { defineComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { MediaSettingsState } from "../../../engine/audio/MediaSettingsState";
import { getMutableState, getState } from "../../../hyperflux";

export const MediaSettingsComponent = defineComponent({
    name: "MediaSettingsComponent",
    jsonID: "EE_media_settings",

    onInit(_entity) {
        return typeof MediaSettingsState.initial === "function"
            ? MediaSettingsState.initial()
            : JSON.parse(JSON.stringify(MediaSettingsState.initial));
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (typeof json.immersiveMedia === "boolean")
            component.immersiveMedia.set(json.immersiveMedia);
        if (typeof json.refDistance === "number") component.refDistance.set(json.refDistance);
        if (typeof json.rolloffFactor === "number") component.rolloffFactor.set(json.rolloffFactor);
        if (typeof json.maxDistance === "number") component.maxDistance.set(json.maxDistance);
        if (typeof json.distanceModel === "string") component.distanceModel.set(json.distanceModel);
        if (typeof json.coneInnerAngle === "number")
            component.coneInnerAngle.set(json.coneInnerAngle);
        if (typeof json.coneOuterAngle === "number")
            component.coneOuterAngle.set(json.coneOuterAngle);
        if (typeof json.coneOuterGain === "number") component.coneOuterGain.set(json.coneOuterGain);
    },

    toJSON: (entity, component) => {
        return {
            immersiveMedia: component.immersiveMedia.value,
            refDistance: component.refDistance.value,
            rolloffFactor: component.rolloffFactor.value,
            maxDistance: component.maxDistance.value,
            distanceModel: component.distanceModel.value,
            coneInnerAngle: component.coneInnerAngle.value,
            coneOuterAngle: component.coneOuterAngle.value,
            coneOuterGain: component.coneOuterGain.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const component = useComponent(entity, MediaSettingsComponent);

        for (const prop of Object.keys(getState(MediaSettingsState))) {
            useEffect(() => {
                if (component[prop].value !== getState(MediaSettingsState)[prop])
                    getMutableState(MediaSettingsState)[prop].set(component[prop].value);
            }, [component[prop]]);
        }

        return null;
    },
});
