import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { LinearTosRGBEffect } from "../../spatial/renderer/effects/LinearTosRGBEffect";

const effectKey = "LinearTosRGBEffect";

export const LinearTosRGBEffectProcessReactor = props => {
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
        const eff = new LinearTosRGBEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const linearTosRGBAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: LinearTosRGBEffectProcessReactor,
            defaultValues: {
                isActive: false,
                skew: 0,
            },
            schema: {},
        },
    });
};
