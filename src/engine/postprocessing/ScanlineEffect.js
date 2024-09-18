import { BlendFunction, ScanlineEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "ScanlineEffect";

export const ScanlineEffectProcessReactor = props => {
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
        const eff = new ScanlineEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const scanlineAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: ScanlineEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.OVERLAY,
                density: 1.25,
                scrollSpeed: 0.0,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                density: {
                    propertyType: PropertyTypes.Number,
                    name: "Density",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
                scrollSpeed: {
                    propertyType: PropertyTypes.Number,
                    name: "Scroll Speed",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
            },
        },
    });
};
