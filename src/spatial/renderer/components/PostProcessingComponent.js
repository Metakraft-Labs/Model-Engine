import React, { Suspense } from "react";
import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { ErrorBoundary, getState, useMutableState } from "../../../hyperflux";
import { RendererComponent } from "../WebGLRendererSystem";
import { PostProcessingEffectState } from "../effects/EffectRegistry";
import { useRendererEntity } from "../functions/useRendererEntity";

export const PostProcessingComponent = defineComponent({
    name: "PostProcessingComponent",
    jsonID: "EE_postprocessing",

    onInit(_entity) {
        return {
            enabled: false,
            effects: {}, // effect name, parameters
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (typeof json.enabled === "boolean") component.enabled.set(json.enabled);
        if (typeof json.effects === "object") component.merge({ effects: json.effects });
    },

    toJSON: (entity, component) => {
        return {
            effects: component.effects.value,
            enabled: component.enabled.value,
        };
    },

    /** @todo this will be replaced with spatial queries or distance checks */
    reactor: () => {
        const entity = useEntityContext();
        const rendererEntity = useRendererEntity(entity);

        if (!rendererEntity) return null;

        return <PostProcessingReactor entity={entity} rendererEntity={rendererEntity} />;
    },
});

const PostProcessingReactor = props => {
    const { entity, rendererEntity } = props;
    const postProcessingComponent = useComponent(entity, PostProcessingComponent);
    const EffectRegistry = useMutableState(PostProcessingEffectState).keys;
    const renderer = useComponent(rendererEntity, RendererComponent);
    const effects = renderer.effects;
    const composer = renderer.effectComposer.value;
    const scene = renderer.scene.value;

    if (!postProcessingComponent.enabled.value) return null;

    // for each effect specified in our postProcessingComponent, we mount a sub-reactor based on the effect registry for that effect ID
    return (
        <>
            {EffectRegistry.map(key => {
                const effect = getState(PostProcessingEffectState)[key]; // get effect registry entry
                if (!effect) return null;
                return (
                    <Suspense key={key}>
                        <ErrorBoundary>
                            <effect.reactor
                                isActive={postProcessingComponent.effects[key]?.isActive}
                                rendererEntity={rendererEntity}
                                effectData={postProcessingComponent.effects}
                                effects={effects}
                                composer={composer}
                                scene={scene}
                            />
                        </ErrorBoundary>
                    </Suspense>
                );
            })}
        </>
    );
};
