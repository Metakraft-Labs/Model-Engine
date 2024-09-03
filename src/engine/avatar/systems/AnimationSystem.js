import { VRM } from "@pixiv/three-vrm";

import { getComponent, getOptionalMutableComponent } from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { getState } from "../../../hyperflux";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { TweenComponent } from "../../../spatial/transform/components/TweenComponent";

import { TransformDirtyUpdateSystem } from "../../../spatial/transform/systems/TransformSystem";
import { ModelComponent } from "../../scene/components/ModelComponent";
import { AnimationComponent } from ".././components/AnimationComponent";
import { LoopAnimationComponent } from "../components/LoopAnimationComponent";
import { updateVRMRetargeting } from "../functions/updateVRMRetargeting";

const tweenQuery = defineQuery([TweenComponent]);
const animationQuery = defineQuery([AnimationComponent, VisibleComponent]);
const loopAnimationQuery = defineQuery([
    AnimationComponent,
    LoopAnimationComponent,
    ModelComponent,
    TransformComponent,
]);

const execute = () => {
    const { deltaSeconds } = getState(ECSState);

    for (const entity of tweenQuery()) {
        const tween = getComponent(entity, TweenComponent);
        tween.update();
    }

    for (const entity of animationQuery()) {
        const animationComponent = getComponent(entity, AnimationComponent);
        const modifiedDelta = deltaSeconds;
        animationComponent.mixer.update(modifiedDelta);
        const animationActionComponent = getOptionalMutableComponent(
            entity,
            LoopAnimationComponent,
        );
        animationActionComponent?._action.value &&
            animationActionComponent?.time.set(animationActionComponent._action.value.time);
    }

    for (const entity of loopAnimationQuery()) {
        const model = getComponent(entity, ModelComponent);
        if (model.asset instanceof VRM) {
            updateVRMRetargeting(model.asset, entity);
        }
    }
};

export const AnimationSystem = defineSystem({
    uuid: "ee.engine.AnimationSystem",
    insert: { before: TransformDirtyUpdateSystem },
    execute,
});
