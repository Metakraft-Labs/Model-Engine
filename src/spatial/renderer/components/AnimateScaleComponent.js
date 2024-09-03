import { Tween } from "@tweenjs/tween.js";
import { useEffect } from "react";

import {
    defineComponent,
    getComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { entityExists, useEntityContext } from "../../../ecs/EntityFunctions";

import { TransformComponent } from "../../transform/components/TransformComponent";
import { TweenComponent } from "../../transform/components/TweenComponent";

export const AnimateScaleComponent = defineComponent({
    name: "AnimateScaleComponent",

    onInit(entity) {
        return {
            multiplier: 1.05,
        };
    },

    onSet(entity, component, json) {
        if (!json) return;

        if (typeof json.multiplier === "number") component.multiplier.set(json.multiplier);
    },

    reactor: function () {
        const entity = useEntityContext();

        useEffect(() => {
            const transformComponent =
                getComponent(entity, TransformComponent) ??
                getComponent(entity, TransformComponent);
            const originalScale = transformComponent.scale.clone();

            const sizeMultiplier = getComponent(entity, AnimateScaleComponent).multiplier;
            animateScale(entity, originalScale.clone().multiplyScalar(sizeMultiplier));

            return () => {
                if (!entityExists(entity)) return;
                animateScale(entity, originalScale);
            };
        }, []);

        return null;
    },
});

/** @todo Export this function so that it is accessible by this file's UnitTests */
const animateScale = (entity, newScale) => {
    const highlight = { scaler: 0 };
    const { scale } =
        getComponent(entity, TransformComponent) ?? getComponent(entity, TransformComponent);
    setComponent(
        entity,
        TweenComponent,
        new Tween() <
            any >
            highlight
                .to(
                    {
                        scaler: 1,
                    },
                    300,
                )
                .onUpdate(() => {
                    scale.lerp(newScale, highlight.scaler);
                })
                .start()
                .onComplete(() => {
                    if (!entityExists(entity)) return;
                    removeComponent(entity, TweenComponent);
                }),
    );
};
