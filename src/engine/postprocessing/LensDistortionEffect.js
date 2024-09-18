import { LensDistortionEffect } from "postprocessing";
import { useEffect } from "react";
import { Vector2 } from "three";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "LensDistortionEffect";

export const LensDistortionEffectProcessReactor = props => {
    const { isActive, effectData, effects } = props;
    const effectState = getState(PostProcessingEffectState);

    useEffect(() => {
        if (effectData[effectKey].value) return;
        effectData[effectKey].set(effectState[effectKey].defaultValues);
    }, []);

    useEffect(() => {
        if (!isActive?.value) {
            if (effects[effectKey].value) effects[effectKey].set(none);
            return;
        }
        const eff = new LensDistortionEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const lensDistortionAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: LensDistortionEffectProcessReactor,
            defaultValues: {
                isActive: false,
                distortion: new Vector2(0, 0),
                principalPoint: new Vector2(0, 0),
                focalLength: new Vector2(1, 1),
                skew: 0,
            },
            schema: {
                distortion: { propertyType: PropertyTypes.Vector2, name: "Distortion" },
                principalPoint: { propertyType: PropertyTypes.Vector2, name: "Principal Point" },
                focalLength: { propertyType: PropertyTypes.Vector2, name: "Focal Length" },
                skew: {
                    propertyType: PropertyTypes.Number,
                    name: "Skew",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
            },
        },
    });
};
