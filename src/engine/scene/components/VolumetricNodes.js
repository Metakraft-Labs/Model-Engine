import { Tween } from "@tweenjs/tween.js";

import { getMutableComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { Entity } from "../../../ecs/Entity";
import { createEntity, removeEntity } from "../../../ecs/EntityFunctions";
import { VolumetricComponent } from "../../../engine/scene/components/VolumetricComponent";
import { TweenComponent } from "../../../spatial/transform/components/TweenComponent";
import { NodeCategory, makeFlowNodeDefinition } from "../../../visual-script";

/**
 * playVolumetric: Play / pause volumetric video
 */
export const playVolumetric = makeFlowNodeDefinition({
    typeName: "engine/media/volumetric/playVolumetric",
    category: NodeCategory.Engine,
    label: "Play Volumetric",
    in: {
        flow: "flow",
        entity: "entity",
        play: "boolean",
    },
    out: { flow: "flow" },
    initialState,
    triggered: ({ read, commit }) => {
        const entity = read < Entity > "entity";
        const play = read < boolean > "play";
        const volumetricComponent = getMutableComponent(entity, VolumetricComponent);
        volumetricComponent.paused.set(!play);
        commit("flow");
    },
});

/**
 * setVolumetricTime: Set volumetric video time
 */
export const setVolumetricTime = makeFlowNodeDefinition({
    typeName: "engine/media/volumetric/setVolumetricTime",
    category: NodeCategory.Engine,
    label: "Set Volumetric Time",
    in: {
        flow: "flow",
        entity: "entity",
        time: "float",
    },
    out: { flow: "flow" },
    initialState,
    triggered: ({ read, commit }) => {
        const entity = read < Entity > "entity";
        const time = read < number > "time";
        const volumetricComponent = getMutableComponent(entity, VolumetricComponent);
        volumetricComponent.currentTrackInfo.currentTime.set(time);
        commit("flow");
    },
});

/**
 * fadeVolumetricVolume: fade in/out volumetric audio volume
 */
export const fadeVolumetricAudioVolume = makeFlowNodeDefinition({
    typeName: "engine/media/volumetric/fadeVolumetricVolume",
    category: NodeCategory.Engine,
    label: "Fade Volumetric Volume",
    in: {
        flow: "flow",
        entity: "entity",
        targetVolume: "float",
        duration: "float",
    },
    out: { flow: "flow" },
    initialState,
    triggered: ({ read, commit }) => {
        const entity = read < Entity > "entity";
        const targetVolume = read < number > "targetVolume";
        const duration = read < number > "duration";

        const volumetricComponent = getMutableComponent(entity, VolumetricComponent);
        const volumeSlider = {};

        Object.defineProperty(volumeSlider, "volume", {
            get: () => volumetricComponent.volume.value,
            set: value => {
                volumetricComponent.volume.set(value);
            },
        });
        const tweenEntity = createEntity();
        setComponent(
            tweenEntity,
            TweenComponent,
            new Tween() <
                any >
                volumeSlider
                    .to({ volume: targetVolume }, duration * 1000)
                    .start()
                    .onComplete(() => {
                        removeEntity(tweenEntity);
                    }),
        );
        commit("flow");
    },
});
