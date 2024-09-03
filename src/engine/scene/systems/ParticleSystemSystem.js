import { ECSState } from "../../../ecs/ECSState";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { getState } from "../../../hyperflux";

import { ParticleState } from "../components/ParticleSystemComponent";
import { SceneObjectSystem } from "./SceneObjectSystem";

const execute = () => {
    const renderers = getState(ParticleState).renderers;
    for (const rendererInstance of Object.values(renderers)) {
        const batchRenderer = rendererInstance.renderer;
        const deltaSeconds = getState(ECSState).deltaSeconds;
        batchRenderer.update(deltaSeconds);
    }
};

export const ParticleSystem = defineSystem({
    uuid: "ee.engine.ParticleSystem",
    insert: { with: SceneObjectSystem },
    execute,
});
