import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineCamera } from "react-icons/hi";

import { getComponent, useComponent } from "../../../../../ecs/ComponentFunctions";
import { Engine } from "../../../../../ecs/Engine";
import { TransformComponent } from "../../../../../spatial/transform/components/TransformComponent";

import { Scene } from "three";
import { ScenePreviewCameraComponent } from "../../../../../engine/scene/components/ScenePreviewCamera";
import { getState } from "../../../../../hyperflux";
import { EngineState } from "../../../../../spatial/EngineState";
import {
    RendererComponent,
    getNestedVisibleChildren,
    getSceneParameters,
} from "../../../../../spatial/renderer/WebGLRendererSystem";
import { computeTransformMatrix } from "../../../../../spatial/transform/systems/TransformSystem";
import Button from "../../../../Button";
import ImagePreviewInput from "../../../../inputs/Image/Preview";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { previewScreenshot } from "../../../functions/takeScreenshot";
import NodeEditor from "../../nodeEditor";

/**
 * ScenePreviewCameraNodeEditor provides the editor view to customize properties.
 */

const scene = new Scene();

export const ScenePreviewCameraNodeEditor = props => {
    const { t } = useTranslation();
    const [bufferUrl, setBufferUrl] = useState("");
    const transformComponent = useComponent(Engine.instance.cameraEntity, TransformComponent);

    const onSetFromViewport = () => {
        const { position, rotation } = getComponent(
            Engine.instance.cameraEntity,
            TransformComponent,
        );
        const transform = getComponent(props.entity, TransformComponent);
        transform.position.copy(position);
        transform.rotation.copy(rotation);
        computeTransformMatrix(props.entity);

        EditorControlFunctions.commitTransformSave([props.entity]);
    };

    const updateScenePreview = async () => {
        const rootEntity = getState(EngineState).viewerEntity;
        const entitiesToRender = getComponent(rootEntity, RendererComponent)
            .scenes.map(getNestedVisibleChildren)
            .flat();
        const { background, environment, fog, children } = getSceneParameters(entitiesToRender);

        scene.children = children;
        scene.environment = environment;
        scene.fog = fog;
        scene.background = background;

        const imageBlob = await previewScreenshot(
            512 / 2,
            320 / 2,
            0.9,
            "jpeg",
            scene,
            getComponent(props.entity, ScenePreviewCameraComponent).camera,
        );
        const url = URL.createObjectURL(imageBlob);
        setBufferUrl(url);
    };

    const updateCubeMapBakeDebounced = useCallback(debounce(updateScenePreview, 500), []); //ms

    useEffect(() => {
        updateCubeMapBakeDebounced();
        return () => {
            updateCubeMapBakeDebounced.cancel();
        };
    }, [transformComponent.position]);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.sceneCamera.name")}
            description={t("editor:properties.sceneCamera.description")}
            icon={<ScenePreviewCameraNodeEditor.iconComponent />}
        >
            <ImagePreviewInput value={bufferUrl} />
            <div className="flex h-auto flex-col items-center">
                <Button
                    onClick={() => {
                        onSetFromViewport();
                        updateScenePreview();
                    }}
                >
                    {t("editor:properties.sceneCamera.lbl-setFromViewPort")}
                </Button>
            </div>
        </NodeEditor>
    );
};

ScenePreviewCameraNodeEditor.iconComponent = HiOutlineCamera;

export default ScenePreviewCameraNodeEditor;
