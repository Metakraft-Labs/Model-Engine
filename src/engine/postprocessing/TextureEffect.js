import { BlendFunction, TextureEffect } from "postprocessing";
import { useEffect } from "react";
import { NO_PROXY, getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { useTexture } from "../assets/functions/resourceLoaderHooks";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "TextureEffect";

export const TextureEffectProcessReactor = props => {
    const { isActive, rendererEntity, effectData, effects } = props;
    const effectState = getState(PostProcessingEffectState);

    const [textureEffectTexture, textureEffectTextureError] = useTexture(
        effectData[effectKey].value?.texturePath,
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
        if (textureEffectTexture) {
            let data = effectData[effectKey].get(NO_PROXY);
            data.texture = textureEffectTexture;
            const eff = new TextureEffect(data);
            effects[effectKey].set(eff);
        }
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive, effectData[effectKey], textureEffectTexture]);

    return null;
};

export const textureAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.NORMAL,
                texturePath: undefined,
                texture: undefined,
                aspectCorrection: false,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                texturePath: { propertyType: PropertyTypes.Texture, name: "Texture" },
                aspectCorrection: {
                    propertyType: PropertyTypes.Boolean,
                    name: "Aspect Correction",
                },
            },
        },
    });
};
