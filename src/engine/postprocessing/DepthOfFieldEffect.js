import { BlendFunction, DepthOfFieldEffect, Resolution } from "postprocessing";
import { useEffect } from "react";
import { useComponent } from "../../ecs";
import { getMutableState, getState, none } from "../../hyperflux";
import { CameraComponent } from "../../spatial/camera/components/CameraComponent";
import { PostProcessingEffectState } from "../../spatial/renderer/effects/EffectRegistry";
import { PropertyTypes } from "./PostProcessingRegister";

const effectKey = "DepthOfFieldEffect";

export const DepthOfFieldEffectProcessReactor = props => {
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
        const camera = useComponent(rendererEntity, CameraComponent);
        const eff = new DepthOfFieldEffect(camera.value, effectData[effectKey].value);
        effects[effectKey].set(eff);
        return () => {
            effects[effectKey].set(none);
        };
    }, [isActive]);

    return null;
};

export const depthOfFieldAddToEffectRegistry = () => {
    // registers the effect

    getMutableState(PostProcessingEffectState).merge({
        [effectKey]: {
            reactor: DepthOfFieldEffectProcessReactor,
            defaultValues: {
                isActive: false,
                blendFunction: BlendFunction.NORMAL,
                focusDistance: 0.0,
                focalLength: 0.1,
                focusRange: 0.1,
                bokehScale: 1.0,
                resolutionScale: 1.0,
                resolutionX: Resolution.AUTO_SIZE,
                resolutionY: Resolution.AUTO_SIZE,
            },
            schema: {
                blendFunction: {
                    propertyType: PropertyTypes.BlendFunction,
                    name: "Blend Function",
                },
                bokehScale: {
                    propertyType: PropertyTypes.Number,
                    name: "Bokeh Scale",
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
                focalLength: {
                    propertyType: PropertyTypes.Number,
                    name: "Focal Length",
                    min: 0,
                    max: 1,
                    step: 0.01,
                },
                focalRange: {
                    propertyType: PropertyTypes.Number,
                    name: "Focal Range",
                    min: 0,
                    max: 1,
                    step: 0.01,
                },
                focusDistance: {
                    propertyType: PropertyTypes.Number,
                    name: "Focus Distance",
                    min: 0,
                    max: 1,
                    step: 0.01,
                },
                resolutionScale: {
                    propertyType: PropertyTypes.Number,
                    name: "Resolution Scale",
                    min: -10,
                    max: 10,
                    step: 0.01,
                },
            },
        },
    });
};
