import { useEffect } from "react";
import { FeatureFlags } from "../../../common/src/constants/FeatureFlags";
import { VisualScriptComponent } from "../../../engine";
import { PositionalAudioComponent } from "../../../engine/audio/components/PositionalAudioComponent";
import { LoopAnimationComponent } from "../../../engine/avatar/components/LoopAnimationComponent";
import { GrabbableComponent } from "../../../engine/interaction/components/GrabbableComponent";
import { InteractableComponent } from "../../../engine/interaction/components/InteractableComponent";
import { AudioAnalysisComponent } from "../../../engine/scene/components/AudioAnalysisComponent";
import { CameraSettingsComponent } from "../../../engine/scene/components/CameraSettingsComponent";
import { EnvMapBakeComponent } from "../../../engine/scene/components/EnvMapBakeComponent";
import { EnvmapComponent } from "../../../engine/scene/components/EnvmapComponent";
import { GroundPlaneComponent } from "../../../engine/scene/components/GroundPlaneComponent";
import { ImageComponent } from "../../../engine/scene/components/ImageComponent";
import { LinkComponent } from "../../../engine/scene/components/LinkComponent";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { MountPointComponent } from "../../../engine/scene/components/MountPointComponent";
import { NewVolumetricComponent } from "../../../engine/scene/components/NewVolumetricComponent";
import { ParticleSystemComponent } from "../../../engine/scene/components/ParticleSystemComponent";
import { PortalComponent } from "../../../engine/scene/components/PortalComponent";
import { PrimitiveGeometryComponent } from "../../../engine/scene/components/PrimitiveGeometryComponent";
import { RenderSettingsComponent } from "../../../engine/scene/components/RenderSettingsComponent";
import { ScenePreviewCameraComponent } from "../../../engine/scene/components/ScenePreviewCamera";
import { SceneSettingsComponent } from "../../../engine/scene/components/SceneSettingsComponent";
import { ShadowComponent } from "../../../engine/scene/components/ShadowComponent";
import { SkyboxComponent } from "../../../engine/scene/components/SkyboxComponent";
import { SpawnPointComponent } from "../../../engine/scene/components/SpawnPointComponent";
import { TextComponent } from "../../../engine/scene/components/TextComponent";
import { VariantComponent } from "../../../engine/scene/components/VariantComponent";
import { VideoComponent } from "../../../engine/scene/components/VideoComponent";
import { VolumetricComponent } from "../../../engine/scene/components/VolumetricComponent";
import useFeatureFlags from "../../../engine/useFeatureFlags";
import { defineState, getMutableState } from "../../../hyperflux";
import {
    AmbientLightComponent,
    DirectionalLightComponent,
    HemisphereLightComponent,
    PointLightComponent,
    SpotLightComponent,
} from "../../../spatial";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { TriggerComponent } from "../../../spatial/physics/components/TriggerComponent";
import { PostProcessingComponent } from "../../../spatial/renderer/components/PostProcessingComponent";
import { LookAtComponent } from "../../../spatial/transform/components/LookAtComponent";

export const ComponentShelfCategoriesState = defineState({
    name: "ee.editor.ComponentShelfCategories",
    initial: () => {
        return {
            Files: [
                ModelComponent,
                VolumetricComponent,
                NewVolumetricComponent,
                PositionalAudioComponent,
                AudioAnalysisComponent,
                VideoComponent,
                ImageComponent,
            ],
            "Scene Composition": [
                CameraComponent,
                PrimitiveGeometryComponent,
                GroundPlaneComponent,
                VariantComponent,
            ],
            Physics: [ColliderComponent, RigidBodyComponent, TriggerComponent],
            Interaction: [
                SpawnPointComponent,
                PortalComponent,
                LinkComponent,
                MountPointComponent,
                InteractableComponent,
                InputComponent,
                GrabbableComponent,
            ],
            Lighting: [
                AmbientLightComponent,
                PointLightComponent,
                SpotLightComponent,
                DirectionalLightComponent,
                HemisphereLightComponent,
            ],
            FX: [
                LoopAnimationComponent,
                ShadowComponent,
                ParticleSystemComponent,
                EnvmapComponent,
                PostProcessingComponent,
            ],
            Scripting: [],
            Settings: [
                SceneSettingsComponent,
                RenderSettingsComponent,
                // MediaSettingsComponent
                CameraSettingsComponent,
            ],
            Visual: [
                EnvMapBakeComponent,
                ScenePreviewCameraComponent,
                SkyboxComponent,
                TextComponent,
                LookAtComponent,
            ],
        };
    },
    reactor: () => {
        const [visualScriptPanelEnabled] = useFeatureFlags([
            FeatureFlags.Studio.Panel.VisualScript,
        ]);
        const cShelfState = getMutableState(ComponentShelfCategoriesState);
        useEffect(() => {
            if (visualScriptPanelEnabled) {
                cShelfState.Scripting.merge([VisualScriptComponent]);
                return () => {
                    cShelfState.Scripting.set(curr => {
                        return curr.splice(
                            curr.findIndex(item => item.name == VisualScriptComponent.name),
                        );
                    });
                };
            }
        }, [visualScriptPanelEnabled]);
    },
});
