import { useEffect } from "react";
import { SkeletonHelper, Vector3 } from "three";

import {
    defineComponent,
    getComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import {
    createEntity,
    entityExists,
    removeEntity,
    useEntityContext,
} from "../../../ecs/EntityFunctions";
import { getMutableState, matches, none, useHookstate } from "../../../hyperflux";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { setObjectLayers } from "../../../spatial/renderer/components/ObjectLayerComponent";
import {
    setVisibleComponent,
    VisibleComponent,
} from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { ComputedTransformComponent } from "../../../spatial/transform/components/ComputedTransformComponent";

import { ModelComponent } from "../../scene/components/ModelComponent";
import { preloadedAnimations } from "../animation/Util";
import { AnimationState } from "../AnimationManager";
import {
    retargetAvatarAnimations,
    setAvatarSpeedFromRootMotion,
    setupAvatarForUser,
    setupAvatarProportions,
} from "../functions/avatarFunctions";
import { AvatarState } from "../state/AvatarNetworkState";
import { AvatarComponent } from "./AvatarComponent";
import { AvatarPendingComponent } from "./AvatarPendingComponent";

export const AvatarAnimationComponent = defineComponent({
    name: "AvatarAnimationComponent",

    onInit: entity => {
        return {
            animationGraph: {
                blendAnimation,
                fadingOut: false,
                blendStrength: 0,
                layer: 0,
            },
            /** ratio between original and target skeleton's root.position.y */
            rootYRatio: 1,
            /** The input vector for 2D locomotion blending space */
            locomotion: new Vector3(),
            /** Time since the last update */
            deltaAccumulator: 0,
            /** Tells us if we are suspended in midair */
            isGrounded: true,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.number.test(json.rootYRatio)) component.rootYRatio.set(json.rootYRatio);
        if (matches.object.test(json.locomotion)) component.locomotion.value.copy(json.locomotion);
        if (matches.number.test(json.deltaAccumulator))
            component.deltaAccumulator.set(json.deltaAccumulator);
        if (matches.boolean.test(json.isGrounded)) component.isGrounded.set(json.isGrounded);
    },
});

export const AvatarRigComponent = defineComponent({
    name: "AvatarRigComponent",

    onInit: entity => {
        return {
            /** rig bones with quaternions relative to the raw bones in their bind pose */
            normalizedRig,
            /** contains the raw bone quaternions */
            rawRig,
            /** contains ik solve data */
            ikMatrices: {},
            helperEntity,
            /** The VRM model */
            vrm,
            avatarURL,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.object.test(json.normalizedRig))
            component.normalizedRig.set(json.normalizedRig);
        if (matches.object.test(json.rawRig)) component.rawRig.set(json.rawRig);
        if (matches.object.test(json.vrm)) component.vrm.set(json.vrm);
        if (matches.string.test(json.avatarURL)) component.avatarURL.set(json.avatarURL);
    },

    onRemove: (entity, component) => {
        // ensure synchronously removed
        if (component.helperEntity.value)
            removeComponent(component.helperEntity.value, ComputedTransformComponent);
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).avatarDebug);
        const rigComponent = useComponent(entity, AvatarRigComponent);
        const pending = useOptionalComponent(entity, AvatarPendingComponent);
        const visible = useOptionalComponent(entity, VisibleComponent);
        const modelComponent = useOptionalComponent(entity, ModelComponent);
        const locomotionAnimationState = useHookstate(
            getMutableState(AnimationState).loadedAnimations[preloadedAnimations.locomotion],
        );

        useEffect(() => {
            if (
                !visible?.value ||
                !debugEnabled.value ||
                pending?.value ||
                !rigComponent.value.normalizedRig?.hips?.node
            )
                return;

            const helper = new SkeletonHelper(rigComponent.value.vrm.scene);
            helper.frustumCulled = false;
            helper.name = `target-rig-helper-${entity}`;

            const helperEntity = createEntity();
            setVisibleComponent(helperEntity, true);
            addObjectToGroup(helperEntity, helper);
            rigComponent.helperEntity.set(helperEntity);
            setComponent(helperEntity, NameComponent, helper.name);
            setObjectLayers(helper, ObjectLayers.AvatarHelper);

            setComponent(helperEntity, ComputedTransformComponent, {
                referenceEntities: [entity],
                computeFunction: () => {
                    // this updates the bone helper lines
                    helper.updateMatrixWorld(true);
                },
            });

            return () => {
                removeEntity(helperEntity);
                rigComponent.helperEntity.set(none);
            };
        }, [visible, debugEnabled, pending, rigComponent.normalizedRig]);

        useEffect(() => {
            if (!modelComponent?.asset?.value) return;
            const model = getComponent(entity, ModelComponent);
            setupAvatarProportions(entity, model.asset);
            setComponent(entity, AvatarRigComponent, {
                vrm: model.asset,
                avatarURL: model.src,
            });
            return () => {
                if (!entityExists(entity)) return;
                setComponent(entity, AvatarRigComponent, {
                    vrm,
                    avatarURL,
                });
            };
        }, [modelComponent?.asset]);

        useEffect(() => {
            if (
                !rigComponent.value ||
                !rigComponent.value.vrm ||
                !rigComponent.value.avatarURL ||
                !locomotionAnimationState?.value
            )
                return;
            const rig = getComponent(entity, AvatarRigComponent);
            try {
                setupAvatarForUser(entity, rig.vrm);
                retargetAvatarAnimations(entity);
            } catch (e) {
                console.error("Failed to load avatar", e);
                if (entity === AvatarComponent.getSelfAvatarEntity())
                    AvatarState.selectRandomAvatar();
            }
        }, [rigComponent.vrm]);

        useEffect(() => {
            if (!locomotionAnimationState?.value) return;
            setAvatarSpeedFromRootMotion();
        }, [locomotionAnimationState]);

        return null;
    },
});
