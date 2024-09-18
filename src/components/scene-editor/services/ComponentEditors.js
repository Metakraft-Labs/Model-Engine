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
import { InstancingComponent } from "../../../engine/scene/components/InstancingComponent";
import { LinkComponent } from "../../../engine/scene/components/LinkComponent";
import { MediaComponent } from "../../../engine/scene/components/MediaComponent";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { MountPointComponent } from "../../../engine/scene/components/MountPointComponent";
import { NewVolumetricComponent } from "../../../engine/scene/components/NewVolumetricComponent";
import { ParticleSystemComponent } from "../../../engine/scene/components/ParticleSystemComponent";
import { PlaylistComponent } from "../../../engine/scene/components/PlaylistComponent";
import { PortalComponent } from "../../../engine/scene/components/PortalComponent";
import { PrimitiveGeometryComponent } from "../../../engine/scene/components/PrimitiveGeometryComponent";
import { ReflectionProbeComponent } from "../../../engine/scene/components/ReflectionProbeComponent";
import { RenderSettingsComponent } from "../../../engine/scene/components/RenderSettingsComponent";
import { SDFComponent } from "../../../engine/scene/components/SDFComponent";
import { ScenePreviewCameraComponent } from "../../../engine/scene/components/ScenePreviewCamera";
import { SceneSettingsComponent } from "../../../engine/scene/components/SceneSettingsComponent";
import { ScreenshareTargetComponent } from "../../../engine/scene/components/ScreenshareTargetComponent";
import { ShadowComponent } from "../../../engine/scene/components/ShadowComponent";
import { SkyboxComponent } from "../../../engine/scene/components/SkyboxComponent";
import { SpawnPointComponent } from "../../../engine/scene/components/SpawnPointComponent";
import { SplineComponent } from "../../../engine/scene/components/SplineComponent";
import { SplineTrackComponent } from "../../../engine/scene/components/SplineTrackComponent";
import { TextComponent } from "../../../engine/scene/components/TextComponent";
import { VariantComponent } from "../../../engine/scene/components/VariantComponent";
import { VideoComponent } from "../../../engine/scene/components/VideoComponent";
import { VolumetricComponent } from "../../../engine/scene/components/VolumetricComponent";
import { defineState } from "../../../hyperflux";
import {
    AmbientLightComponent,
    DirectionalLightComponent,
    HemisphereLightComponent,
    PointLightComponent,
    SpotLightComponent,
} from "../../../spatial";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { TriggerComponent } from "../../../spatial/physics/components/TriggerComponent";
import { FogSettingsComponent } from "../../../spatial/renderer/components/FogSettingsComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { PostProcessingComponent } from "../../../spatial/renderer/components/PostProcessingComponent";
import { LookAtComponent } from "../../../spatial/transform/components/LookAtComponent";
import { PersistentAnchorComponent } from "../../../spatial/xr/XRAnchorComponents";

// everything above still needs to be built
import PersistentAnchorNodeEditor from "../properties/anchor";
import LoopAnimationNodeEditor from "../properties/animation";
import AudioAnalysisEditor from "../properties/audio/analysis";
import PositionalAudioNodeEditor from "../properties/audio/positional";
import CameraNodeEditor from "../properties/camera";
import CameraPropertiesNodeEditor from "../properties/cameraProperties";
import ColliderComponentEditor from "../properties/collider";
import EnvMapBakeNodeEditor from "../properties/envMapBake";
import EnvMapEditor from "../properties/envmap";
import FogSettingsEditor from "../properties/fog";
import PrimitiveGeometryNodeEditor from "../properties/geometry/primitive";
import GrabbableComponentNodeEditor from "../properties/grab";
import GroundPlaneNodeEditor from "../properties/groundPlane";
import ImageNodeEditor from "../properties/image";
import InputComponentNodeEditor from "../properties/input";
import InstancingNodeEditor from "../properties/instance";
import InteractableComponentNodeEditor from "../properties/interact";
import AmbientLightNodeEditor from "../properties/light/ambient";
import DirectionalLightNodeEditor from "../properties/light/directional";
import HemisphereLightNodeEditor from "../properties/light/hemisphere";
import PointLightNodeEditor from "../properties/light/point";
import SpotLightNodeEditor from "../properties/light/spot";
import LinkNodeEditor from "../properties/link";
import LookAtNodeEditor from "../properties/lookAt";
import MediaNodeEditor from "../properties/media";
import MeshNodeEditor from "../properties/mesh";
import ModelNodeEditor from "../properties/model";
import MountPointNodeEditor from "../properties/mountPoint";
import ParticleSystemNodeEditor from "../properties/particle";
import PortalNodeEditor from "../properties/portal";
import PostProcessingSettingsEditor from "../properties/postProcessing";
import ReflectionProbeNodeEditor from "../properties/reflectionProbe";
import RenderSettingsEditor from "../properties/render";
import RigidBodyComponentEditor from "../properties/rigidBody";
import ScenePreviewCameraNodeEditor from "../properties/scene/previewCamera";
import SceneSettingsEditor from "../properties/scene/settings";
import ScreenshareTargetNodeEditor from "../properties/screenShareTarget";
import SDFEditor from "../properties/sdf";
import ShadowNodeEditor from "../properties/shadow";
import SkyboxNodeEditor from "../properties/skybox";
import SpawnPointNodeEditor from "../properties/spawnPoint";
import SplineNodeEditor from "../properties/spline";

import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import PlaylistNodeEditor from "../properties/playlist";
import SplineTrackNodeEditor from "../properties/spline/track";
import TextNodeEditor from "../properties/text";
import TriggerComponentEditor from "../properties/trigger";
import VariantNodeEditor from "../properties/variant";
import VideoNodeEditor from "../properties/video";
import VisualScriptNodeEditor from "../properties/visualScript";
import VolumetricNodeEditor from "../properties/volumetric";
import NewVolumetricNodeEditor from "../properties/volumetric/new";

export const ComponentEditorsState = defineState({
    name: "ee.editor.ComponentEditorsState",
    initial: () => {
        return {
            [SceneSettingsComponent.name]: SceneSettingsEditor,
            [PostProcessingComponent.name]: PostProcessingSettingsEditor,
            // [MediaSettingsComponent.name]: MediaSettingsEditor,
            [RenderSettingsComponent.name]: RenderSettingsEditor,
            [FogSettingsComponent.name]: FogSettingsEditor,
            [CameraSettingsComponent.name]: CameraPropertiesNodeEditor,
            [CameraComponent.name]: CameraNodeEditor,
            [DirectionalLightComponent.name]: DirectionalLightNodeEditor,
            [HemisphereLightComponent.name]: HemisphereLightNodeEditor,
            [AmbientLightComponent.name]: AmbientLightNodeEditor,
            [PointLightComponent.name]: PointLightNodeEditor,
            [SpotLightComponent.name]: SpotLightNodeEditor,
            [SDFComponent.name]: SDFEditor,
            [GroundPlaneComponent.name]: GroundPlaneNodeEditor,
            [MeshComponent.name]: MeshNodeEditor,
            [ModelComponent.name]: ModelNodeEditor,
            [ShadowComponent.name]: ShadowNodeEditor,
            [LoopAnimationComponent.name]: LoopAnimationNodeEditor,
            [ParticleSystemComponent.name]: ParticleSystemNodeEditor,
            [PrimitiveGeometryComponent.name]: PrimitiveGeometryNodeEditor,
            [PortalComponent.name]: PortalNodeEditor,
            [MountPointComponent.name]: MountPointNodeEditor,
            [RigidBodyComponent.name]: RigidBodyComponentEditor,
            [ColliderComponent.name]: ColliderComponentEditor,
            [TriggerComponent.name]: TriggerComponentEditor,
            [ScenePreviewCameraComponent.name]: ScenePreviewCameraNodeEditor,
            [SkyboxComponent.name]: SkyboxNodeEditor,
            [SpawnPointComponent.name]: SpawnPointNodeEditor,
            [MediaComponent.name]: MediaNodeEditor,
            [ImageComponent.name]: ImageNodeEditor,
            [PositionalAudioComponent.name]: PositionalAudioNodeEditor,
            [AudioAnalysisComponent.name]: AudioAnalysisEditor,
            [VideoComponent.name]: VideoNodeEditor,
            [VolumetricComponent.name]: VolumetricNodeEditor,
            [NewVolumetricComponent.name]: NewVolumetricNodeEditor,
            [PlaylistComponent.name]: PlaylistNodeEditor,
            [EnvmapComponent.name]: EnvMapEditor,
            [EnvMapBakeComponent.name]: EnvMapBakeNodeEditor,
            [InstancingComponent.name]: InstancingNodeEditor,
            [PersistentAnchorComponent.name]: PersistentAnchorNodeEditor,
            [VariantComponent.name]: VariantNodeEditor,
            [SplineComponent.name]: SplineNodeEditor,
            [SplineTrackComponent.name]: SplineTrackNodeEditor,
            [VisualScriptComponent.name]: VisualScriptNodeEditor,
            [LinkComponent.name]: LinkNodeEditor,
            [InteractableComponent.name]: InteractableComponentNodeEditor,
            [InputComponent.name]: InputComponentNodeEditor,
            [GrabbableComponent.name]: GrabbableComponentNodeEditor,
            [ScreenshareTargetComponent.name]: ScreenshareTargetNodeEditor,
            [TextComponent.name]: TextNodeEditor,
            [LookAtComponent.name]: LookAtNodeEditor,
            [ReflectionProbeComponent.name]: ReflectionProbeNodeEditor,
        };
    },
});
