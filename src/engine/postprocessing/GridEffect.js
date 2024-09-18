import { BlendFunction, GridEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "GridEffect";

export const GridEffectProcessReactor = props => {
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
        const eff = new GridEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const gridAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: GridEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.OVERLAY,
                scale: 1.0,
                lineWidth: 0.0,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                scale: {
                    propertyType: PropertyTypes.Number,
                    name: "Scale",
                    min: 0,
                    max: 10,
                    step: 0.1,
                },
                lineWidth: {
                    propertyType: PropertyTypes.Number,
                    name: "Line Width",
                    min: 0,
                    max: 10,
                    step: 0.1,
                },
            },
        },
    });
};
