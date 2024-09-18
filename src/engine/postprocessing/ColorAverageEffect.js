import { BlendFunction, ColorAverageEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "ColorAverageEffect";

export const ColorAverageEffectProcessReactor = props => {
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
        const eff = new ColorAverageEffect(effectData[effectKey].value.blendFunction);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const colorAverageAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: ColorAverageEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.NORMAL,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
            },
        },
    });
};
