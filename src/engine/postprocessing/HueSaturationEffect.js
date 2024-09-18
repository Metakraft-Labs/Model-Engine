import { BlendFunction, HueSaturationEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "HueSaturationEffect";

export const HueSaturationEffectProcessReactor = props => {
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
        const eff = new HueSaturationEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const hueSaturationAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: HueSaturationEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.SRC,
                hue: 0,
                saturation: 0.0,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                hue: {
                    propertyType: PropertyTypes.Number,
                    name: "Hue",
                    min: -1,
                    max: 1,
                    step: 0.01,
                },
                saturation: {
                    propertyType: PropertyTypes.Number,
                    name: "Saturation",
                    min: -1,
                    max: 1,
                    step: 0.01,
                },
            },
        },
    });
};
