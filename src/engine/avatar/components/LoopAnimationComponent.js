import { VRM } from "@pixiv/three-vrm";
import { useEffect } from "react";
import { LoopRepeat, NormalAnimationBlendMode } from "three";

import {
    defineComponent,
    getComponent,
    hasComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { NO_PROXY, useHookstate } from "../../../hyperflux";
import {
    CallbackComponent,
    StandardCallbacks,
    setCallback,
} from "../../../spatial/common/CallbackComponent";

import { useGLTF } from "../../assets/functions/resourceLoaderHooks";
import { ModelComponent } from "../../scene/components/ModelComponent";
import { bindAnimationClipFromMixamo, retargetAnimationClip } from "../functions/retargetMixamoRig";
import { AnimationComponent } from "./AnimationComponent";

export const LoopAnimationComponent = defineComponent({
    name: "LoopAnimationComponent",
    jsonID: "EE_loop_animation",

    onInit: _entity => {
        return {
            activeClipIndex: -1,
            animationPack: "",

            // TODO: support blending multiple animation actions. Refactor into AnimationMixerComponent and AnimationActionComponent
            paused: false,
            enabled: true,
            time: 0,
            timeScale: 1,
            blendMode: NormalAnimationBlendMode,
            loop: LoopRepeat,
            repetitions: Infinity,
            clampWhenFinished: false,
            zeroSlopeAtStart: true,
            zeroSlopeAtEnd: true,
            weight: 1,

            // internal
            _action,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (typeof json.animationSpeed === "number") component.timeScale.set(json.animationSpeed); // backwards-compat
        if (typeof json.activeClipIndex === "number")
            component.activeClipIndex.set(json.activeClipIndex);
        if (typeof json.animationPack === "string") component.animationPack.set(json.animationPack);
        if (typeof json.paused === "number") component.paused.set(json.paused);
        if (typeof json.time === "number") component.time.set(json.time);
        if (typeof json.timeScale === "number") component.timeScale.set(json.timeScale);
        if (typeof json.blendMode === "number") component.blendMode.set(json.blendMode);
        if (typeof json.loop === "number") component.loop.set(json.loop);
        if (typeof json.repetitions === "number") component.repetitions.set(json.repetitions);
        if (typeof json.clampWhenFinished === "boolean")
            component.clampWhenFinished.set(json.clampWhenFinished);
        if (typeof json.zeroSlopeAtStart === "boolean")
            component.zeroSlopeAtStart.set(json.zeroSlopeAtStart);
        if (typeof json.zeroSlopeAtEnd === "boolean")
            component.zeroSlopeAtEnd.set(json.zeroSlopeAtEnd);
        if (typeof json.weight === "number") component.weight.set(json.weight);
    },

    toJSON: (_entity, component) => {
        return {
            activeClipIndex: component.activeClipIndex.value,
            animationPack: component.animationPack.value,
            paused: component.paused.value,
            time: component.time.value,
            timeScale: component.timeScale.value,
            blendMode: component.blendMode.value,
            loop: component.loop.value,
            clampWhenFinished: component.clampWhenFinished.value,
            zeroSlopeAtStart: component.zeroSlopeAtStart.value,
            zeroSlopeAtEnd: component.zeroSlopeAtEnd.value,
            weight: component.weight.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();

        const loopAnimationComponent = useComponent(entity, LoopAnimationComponent);
        const modelComponent = useOptionalComponent(entity, ModelComponent);
        const animComponent = useOptionalComponent(entity, AnimationComponent);
        const animationAction = loopAnimationComponent._action.value;

        const lastAnimationPack = useHookstate("");
        useEffect(() => {
            if (!animComponent?.animations?.value) return;
            const clip =
                animComponent.animations.value[loopAnimationComponent.activeClipIndex.value];
            const asset = modelComponent?.asset.get(NO_PROXY) ?? null;
            if (!modelComponent || !asset?.scene || !clip) {
                loopAnimationComponent._action.set(null);
                return;
            }
            animComponent.mixer.time.set(0);
            const assetObject = modelComponent.asset.get(NO_PROXY);
            try {
                const action = animComponent.mixer.value.clipAction(
                    assetObject instanceof VRM
                        ? bindAnimationClipFromMixamo(clip, assetObject)
                        : clip,
                );
                loopAnimationComponent._action.set(action);
                return () => {
                    action.stop();
                };
            } catch (e) {
                console.warn("Failed to bind animation in LoopAnimationComponent", entity, e);
            }
        }, [
            loopAnimationComponent.activeClipIndex,
            modelComponent?.asset,
            animComponent?.animations,
        ]);

        useEffect(() => {
            if (animationAction?.isRunning()) {
                animationAction.paused = loopAnimationComponent.paused.value;
            } else if (!animationAction?.isRunning() && !loopAnimationComponent.paused.value) {
                animationAction?.getMixer().stopAllAction();
                animationAction?.reset();
                animationAction?.play();
            }
        }, [loopAnimationComponent._action, loopAnimationComponent.paused]);

        useEffect(() => {
            if (!animationAction) return;
            animationAction.enabled = loopAnimationComponent.enabled.value;
        }, [loopAnimationComponent._action, loopAnimationComponent.enabled]);

        useEffect(() => {
            if (!animationAction) return;
            animationAction.time = loopAnimationComponent.time.value;
            animationAction.setLoop(
                loopAnimationComponent.loop.value,
                loopAnimationComponent.repetitions.value,
            );
            animationAction.clampWhenFinished = loopAnimationComponent.clampWhenFinished.value;
            animationAction.zeroSlopeAtStart = loopAnimationComponent.zeroSlopeAtStart.value;
            animationAction.zeroSlopeAtEnd = loopAnimationComponent.zeroSlopeAtEnd.value;
            animationAction.blendMode = loopAnimationComponent.blendMode.value;
        }, [
            loopAnimationComponent._action,
            loopAnimationComponent.blendMode,
            loopAnimationComponent.loop,
            loopAnimationComponent.clampWhenFinished,
            loopAnimationComponent.zeroSlopeAtStart,
            loopAnimationComponent.zeroSlopeAtEnd,
        ]);

        useEffect(() => {
            if (!animationAction) return;
            animationAction.setEffectiveWeight(loopAnimationComponent.weight.value);
            animationAction.setEffectiveTimeScale(loopAnimationComponent.timeScale.value);
        }, [
            loopAnimationComponent._action,
            loopAnimationComponent.weight,
            loopAnimationComponent.timeScale,
        ]);

        /**
         * Callback functions
         */
        useEffect(() => {
            if (hasComponent(entity, CallbackComponent)) return;
            const play = () => {
                loopAnimationComponent.paused.set(false);
            };
            const pause = () => {
                loopAnimationComponent.paused.set(true);
            };
            setCallback(entity, StandardCallbacks.PLAY, play);
            setCallback(entity, StandardCallbacks.PAUSE, pause);
        }, []);

        /**
         * A model is required for LoopAnimationComponent.
         */
        useEffect(() => {
            const asset = modelComponent?.asset.get(NO_PROXY) ?? null;
            if (!asset?.scene) return;
            const model = getComponent(entity, ModelComponent);
        }, [modelComponent?.asset]);

        const [gltf] = useGLTF(loopAnimationComponent.animationPack.value, entity);

        useEffect(() => {
            const asset = modelComponent?.asset.get(NO_PROXY) ?? null;
            if (
                !gltf ||
                !animComponent ||
                !asset?.scene ||
                !loopAnimationComponent.animationPack.value ||
                lastAnimationPack.value === loopAnimationComponent.animationPack.value
            )
                return;

            animComponent.mixer.time.set(0);
            animComponent.mixer.value.stopAllAction();
            const animations = gltf.animations;
            for (let i = 0; i < animations.length; i++)
                retargetAnimationClip(animations[i], gltf.scene);
            lastAnimationPack.set(loopAnimationComponent.animationPack.get(NO_PROXY));
            animComponent.animations.set(animations);
        }, [gltf, animComponent, modelComponent?.asset]);

        return null;
    },
});
