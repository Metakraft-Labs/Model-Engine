import { BlendFunction, LUT1DEffect } from "postprocessing";
import { useEffect } from "react";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { useTexture } from "../assets/functions/resourceLoaderHooks";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "LUT1DEffect";

export const LUT1DEffectProcessReactor = props => {
    const { isActive, effectData, effects } = props;
    const effectState = getState(PostProcessingEffectState);

    const [lut1DEffectTexture, lut1DEffectTextureError] = useTexture(
        effectData[effectKey].value?.lutPath,
    );

    useEffect(() => {
        if (effectData[effectKey].value) return;
        effectData[effectKey].set(effectState[effectKey].defaultValues);
    }, []);

    useEffect(() => {
        if (!isActive?.value) {
            if (effects[effectKey].value) effects[effectKey].set(none);
            return;
        }

        if (lut1DEffectTexture) {
            const eff = new LUT1DEffect(lut1DEffectTexture, effectData[effectKey].value);
            effects[effectKey].set(eff);
        }
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive, effectData[effectKey], lut1DEffectTexture]);

    return null;
};

export const lut1DAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: LUT1DEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.SRC,
                lutPath: undefined,
                lut: undefined,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                lutPath: { propertyType: PropertyTypes.Texture, name: "LUT" },
            },
        },
    });
};
