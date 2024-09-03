import { BlendFunction, BrightnessContrastEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "BrightnessContrastEffect";

export const BrightnessContrastEffectProcessReactor = props => {
    const { isActive, rendererEntity, effectData, effects } = props;
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
        const eff = new BrightnessContrastEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const brightnessContrastAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: BrightnessContrastEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.SRC,
                brightness: 0.0,
                contrast: 0.0,
            },
            schema: {
                brightness: {
                    propertyType: PropertyTypes.Number,
                    name: "Brightness",
                    min: -1,
                    max: 1,
                    step: 0.01,
                },
                contrast: {
                    propertyType: PropertyTypes.Number,
                    name: "Contrast",
                    min: -1,
                    max: 1,
                    step: 0.01,
                },
            },
        },
    });
};
