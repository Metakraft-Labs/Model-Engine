import { useEffect } from "react";
import { useEntityContext } from "../../../ecs";
import {
    defineComponent,
    getMutableComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { NO_PROXY } from "../../../hyperflux";

export const PlaylistComponent = defineComponent({
    name: "PlaylistComponent",
    jsonID: "EE_playlist",

    onInit: _entity => ({
        tracks: [],
        currentTrackUUID: "",
        currentTrackIndex: -1,
        paused: true,
        playMode: "loop",
        autoplay: true,
    }),

    onSet: (entity, component, json) => {
        if (!json) return;
        if (json.tracks && Array.isArray(json.tracks)) component.tracks.set(json.tracks);
        if (typeof json.currentTrackUUID === "string")
            component.currentTrackUUID.set(json.currentTrackUUID);
        if (typeof json.currentTrackIndex === "number")
            component.currentTrackIndex.set(json.currentTrackIndex);
        if (typeof json.playMode === "string") component.playMode.set(json.playMode);
        if (typeof json.paused === "boolean") component.paused.set(json.paused);
        if (typeof json.autoplay === "boolean") component.autoplay.set(json.autoplay);
    },

    toJSON: (entity, component) => {
        return {
            tracks: component.tracks.value,
            playMode: component.playMode.value,
            autoplay: component.autoplay.value,
        };
    },

    playNextTrack: (entity, delta = 1) => {
        const component = getMutableComponent(entity, PlaylistComponent);
        const tracksCount = component.tracks.value.length;

        if (tracksCount === 0) return;

        if (tracksCount === 1 || component.playMode.value === "singleloop") {
            const currentTrackUUID = component.currentTrackUUID.value;
            component.currentTrackUUID.set("");
            component.currentTrackUUID.set(currentTrackUUID);

            return;
        }

        if (component.playMode.value === "loop") {
            const previousTrackIndex =
                (component.currentTrackIndex.value + delta + tracksCount) % tracksCount;
            component.currentTrackUUID.set(component.tracks[previousTrackIndex].uuid.value);
        } else if (component.playMode.value === "random") {
            let randomIndex = (Math.floor(Math.random() * tracksCount) + tracksCount) % tracksCount;

            // Ensure that the random index is different from the current track index
            while (randomIndex === component.currentTrackIndex.value) {
                randomIndex = (Math.floor(Math.random() * tracksCount) + tracksCount) % tracksCount;
            }

            component.currentTrackUUID.set(component.tracks[randomIndex].uuid.value);
        }
    },
    reactor: () => {
        const entity = useEntityContext();
        const component = useComponent(entity, PlaylistComponent);

        const findTrack = trackUUID => {
            for (let i = 0; i < component.tracks.length; i++) {
                if (component.tracks[i].uuid.value === trackUUID) {
                    return {
                        track: component.tracks[i].get(NO_PROXY),
                        index: i,
                    };
                }
            }
            return {
                track,
                index: -1,
            };
        };

        useEffect(() => {
            const index = findTrack(component.currentTrackUUID.value).index;
            component.currentTrackIndex.set(index);
        }, [component.currentTrackUUID, component.tracks]);

        useEffect(() => {
            if (component.tracks.length === 0) {
                component.merge({
                    currentTrackUUID: "",
                    currentTrackIndex: -1,
                });
                return;
            }
        }, [component.tracks]);

        useEffect(() => {
            if (component.autoplay.value && component.tracks.length > 0) {
                let nonEmptyTrackIndex = -1;
                for (let i = 0; i < component.tracks.length; i++) {
                    if (component.tracks[i].src.value !== "") {
                        nonEmptyTrackIndex = i;
                        break;
                    }
                }
                if (nonEmptyTrackIndex === -1) return;

                if (component.currentTrackUUID.value === "") {
                    component.merge({
                        currentTrackUUID: component.tracks[nonEmptyTrackIndex].uuid.value,
                        currentTrackIndex: nonEmptyTrackIndex,
                    });
                    component.paused.set(false);
                }
            }
        }, [component.autoplay, component.tracks]);

        return null;
    },
});
