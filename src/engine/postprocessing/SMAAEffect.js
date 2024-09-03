import { EdgeDetectionMode, PredicationMode, SMAAEffect, SMAAPreset } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "SMAAEffect";

export const SMAAEffectProcessReactor = props => {
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
        const eff = new SMAAEffect(effectData[effectKey].granularity.value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const smaaAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: SMAAEffectProcessReactor,
            defaultValues: {
                isActive: false,
                preset: SMAAPreset.MEDIUM,
                edgeDetectionMode: EdgeDetectionMode.COLOR,
                predicationMode: PredicationMode.DISABLED,
            },
            schema: {
                preset: { propertyType: PropertyTypes.SMAAPreset, name: "Preset" },
            },
        },
    });
};
