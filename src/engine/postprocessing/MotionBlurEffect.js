import { useEffect } from "react";
import { MotionBlurEffect, VelocityDepthNormalPass } from "realism-effects";
import { Scene } from "three";
import { useComponent } from "../../../ecs";
import { PostProcessingEffectState } from "../../../spatial/renderer/effects/EffectRegistry";
import { getMutableState, getState, none, useHookstate } from "../../hyperflux";
import { CameraComponent } from "../../spatial/camera/components/CameraComponent";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "MotionBlurEffect";

export const MotionBlurEffectProcessReactor = props => {
    const { isActive, rendererEntity, effectData, effects } = props;
    const effectState = getState(PostProcessingEffectState);
    const camera = useComponent(rendererEntity, CameraComponent);
    const scene = useHookstate < Scene > (() => new Scene());
    const velocityDepthNormalPass = useHookstate(new VelocityDepthNormalPass(scene, camera));
    const useVelocityDepthNormalPass = useHookstate(false);

    useEffect(() => {
        if (effectData[effectKey].value) return;
        effectData[effectKey].set(effectState[effectKey].defaultValues);
    }, []);

    useEffect(() => {
        if (!isActive?.value) {
            if (effects[effectKey].value) effects[effectKey].set(none);
            return;
        }
        const eff = new MotionBlurEffect(velocityDepthNormalPass, effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const motionBlurAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: MotionBlurEffectProcessReactor,
            defaultValues: {
                isActive: false,
                intensity: 1,
                jitter: 1,
                samples: 16,
            },
            schema: {
                intensity: {
                    propertyType: PropertyTypes.Number,
                    name: "Intensity",
                    min: 0,
                    max: 10,
                    step: 0.01,
                },
                jitter: {
                    propertyType: PropertyTypes.Number,
                    name: "Jitter",
                    min: 0,
                    max: 10,
                    step: 0.01,
                },
                samples: {
                    propertyType: PropertyTypes.Number,
                    name: "Samples",
                    min: 1,
                    max: 64,
                    step: 1,
                },
            },
        },
    });
};
