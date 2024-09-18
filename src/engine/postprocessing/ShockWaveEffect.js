import { ShockWaveEffect } from "postprocessing";
import { useEffect } from "react";
import { Vector3 } from "three";
import { getMutableState, getState, none } from "../../hyperflux";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "ShockWaveEffect";

export const ShockWaveEffectProcessReactor = props => {
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
        const eff = new ShockWaveEffect(effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const shockWaveAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: ShockWaveEffectProcessReactor,
            defaultValues: {
                isActive: false,
                position: new Vector3(0, 0, 0),
                speed: 2.0,
                maxRadius: 1.0,
                waveSize: 0.2,
                amplitude: 0.05,
            },
            schema: {
                position: { propertyType: PropertyTypes.Vector3, name: "Position" },
                speed: {
                    propertyType: PropertyTypes.Number,
                    name: "Speed",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
                maxRadius: {
                    propertyType: PropertyTypes.Number,
                    name: "Max Radius",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
                waveSize: {
                    propertyType: PropertyTypes.Number,
                    name: "Wave Size",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
                amplitude: {
                    propertyType: PropertyTypes.Number,
                    name: "Amplitude",
                    min: 0,
                    max: 10,
                    step: 0.05,
                },
            },
        },
    });
};
