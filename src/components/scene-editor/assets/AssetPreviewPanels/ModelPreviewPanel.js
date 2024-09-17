import React, { useEffect, useRef } from "react";

import { useRender3DPanelSystem } from "../../../../client-core/src/user/components/Panel3D/useRender3DPanelSystem";
import { createEntity, removeComponent, removeEntity, setComponent } from "../../../../ecs";
import { AssetPreviewCameraComponent } from "../../../../engine/camera/components/AssetPreviewCameraComponent";
import { EnvmapComponent } from "../../../../engine/scene/components/EnvmapComponent";
import { ModelComponent } from "../../../../engine/scene/components/ModelComponent";
import { useHookstate } from "../../../../hyperflux";
import { AmbientLightComponent, TransformComponent } from "../../../../spatial";
import { NameComponent } from "../../../../spatial/common/NameComponent";
import { VisibleComponent } from "../../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../../spatial/transform/components/EntityTree";

import { CircularProgress } from "@mui/material";
import styles from "../styles.module.scss";

export const ModelPreviewPanel = props => {
    const url = props.resourceProps.resourceUrl;
    const loading = useHookstate(true);

    const error = useHookstate("");
    const panelRef = useRef();
    const renderPanel = useRender3DPanelSystem(panelRef);

    useEffect(() => {
        const { sceneEntity, cameraEntity } = renderPanel;
        setComponent(sceneEntity, NameComponent, "3D Preview Entity");
        setComponent(sceneEntity, ModelComponent, { src: url, cameraOcclusion: false });
        setComponent(sceneEntity, EnvmapComponent, { type: "Skybox", envMapIntensity: 2 }); // todo remove when lighting works
        setComponent(cameraEntity, AssetPreviewCameraComponent, { targetModelEntity: sceneEntity });

        const lightEntity = createEntity();
        setComponent(lightEntity, AmbientLightComponent);
        setComponent(lightEntity, TransformComponent);
        setComponent(lightEntity, VisibleComponent);
        setComponent(lightEntity, NameComponent, "Ambient Light");
        setComponent(lightEntity, EntityTreeComponent, { parentEntity: sceneEntity });
        loading.set(false);

        return () => {
            loading.set(true);
            removeComponent(sceneEntity, ModelComponent);
            removeComponent(sceneEntity, EnvmapComponent);
            removeComponent(cameraEntity, AssetPreviewCameraComponent);
            removeEntity(lightEntity);
        };
    }, [url]);

    return (
        <>
            {loading.value && <CircularProgress sx={{ height: "6rem", width: "6rem" }} />}
            {error.value && (
                <div className={styles.container}>
                    <h1 className={styles.error}>{error.value}</h1>
                </div>
            )}
            <div id="modelPreview" style={{ width: "100%", height: "100%" }}>
                <canvas
                    ref={panelRef}
                    style={{ width: "100%", height: "100%", pointerEvents: "all" }}
                />
            </div>
        </>
    );
};
