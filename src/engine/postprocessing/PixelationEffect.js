import { PixelationEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "PixelationEffect";

export const PixelationEffectProcessReactor = props => {
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
        const eff = new PixelationEffect(effectData[effectKey].granularity.value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const pixelationAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: PixelationEffectProcessReactor,
            defaultValues: {
                isActive: false,
                granularity: 30,
            },
            schema: {
                granularity: {
                    propertyType: PropertyTypes.Number,
                    name: "Granularity",
                    min: 0,
                    max: 1000,
                    step: 1,
                },
            },
        },
    });
};
