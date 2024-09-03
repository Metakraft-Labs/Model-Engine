import { useLayoutEffect } from "react";
import { PerspectiveCamera } from "three";

import { useExecute } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, useHookstate } from "../../../hyperflux";
import { CameraHelperComponent } from "../../../spatial/common/debug/CameraHelperComponent";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { TransformDirtyCleanupSystem } from "../../../spatial/transform/systems/TransformSystem";

export const ScenePreviewCameraComponent = defineComponent({
    name: "EE_scenePreviewCamera",
    jsonID: "EE_scene_preview_camera",

    onInit: entity => {
        const camera = new PerspectiveCamera(80, 16 / 9, 0.2, 8000);

        return {
            camera,
        };
    },

    toJSON: () => {
        return {};
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const previewCamera = useComponent(entity, ScenePreviewCameraComponent);
        const previewCameraTransform = useComponent(entity, TransformComponent);
        const engineCameraTransform = useComponent(
            Engine.instance.cameraEntity,
            TransformComponent,
        );

        useLayoutEffect(() => {
            const transform = getComponent(entity, TransformComponent);
            const cameraTransform = getComponent(Engine.instance.cameraEntity, TransformComponent);
            cameraTransform.position.copy(transform.position);
            cameraTransform.rotation.copy(transform.rotation);
            const camera = previewCamera.camera.value;
            addObjectToGroup(entity, camera);
            return () => {
                removeObjectFromGroup(entity, camera);
            };
        }, []);

        useExecute(
            () => {
                if (!TransformComponent.dirtyTransforms[entity]) return;
                const camera = getComponent(entity, ScenePreviewCameraComponent).camera;
                camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
            },
            { before: TransformDirtyCleanupSystem },
        );

        useLayoutEffect(() => {
            engineCameraTransform.position.value.copy(previewCameraTransform.position.value);
            engineCameraTransform.rotation.value.copy(previewCameraTransform.rotation.value);
        }, [previewCameraTransform]);

        useLayoutEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, CameraHelperComponent, {
                    name: "scene-preview-helper",
                    camera: previewCamera.camera.value,
                });
            }
            return () => {
                removeComponent(entity, CameraHelperComponent);
            };
        }, [debugEnabled]);

        return null;
    },
});
