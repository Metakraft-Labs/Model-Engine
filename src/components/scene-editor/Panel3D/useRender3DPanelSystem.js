import { useEffect } from "react";

import {
    UUIDComponent,
    UndefinedEntity,
    createEntity,
    generateEntityUUID,
    hasComponent,
    setComponent,
} from "../../../ecs";
import { useHookstate } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { CameraOrbitComponent } from "../../../spatial/camera/components/CameraOrbitComponent";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import {
    RendererComponent,
    initializeEngineRenderer,
} from "../../../spatial/renderer/WebGLRendererSystem";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import {
    EntityTreeComponent,
    removeEntityNodeRecursively,
} from "../../../spatial/transform/components/EntityTree";

export function useRender3DPanelSystem(canvas) {
    const canvasRef = useHookstate(canvas.current);

    const panelState = useHookstate(() => {
        const sceneEntity = createEntity();
        const uuid = generateEntityUUID();
        setComponent(sceneEntity, UUIDComponent, uuid + "-scene");
        setComponent(sceneEntity, TransformComponent);
        setComponent(sceneEntity, VisibleComponent);
        setComponent(sceneEntity, EntityTreeComponent, { parentEntity: UndefinedEntity });

        const cameraEntity = createEntity();
        setComponent(cameraEntity, UUIDComponent, uuid + "-camera");
        setComponent(cameraEntity, CameraComponent);
        setComponent(cameraEntity, TransformComponent);
        setComponent(cameraEntity, VisibleComponent);
        setComponent(cameraEntity, CameraOrbitComponent, { refocus: true });
        setComponent(cameraEntity, InputComponent);
        setComponent(cameraEntity, EntityTreeComponent, { parentEntity: UndefinedEntity });

        return {
            cameraEntity,
            sceneEntity,
        };
    });

    useEffect(() => {
        const { cameraEntity, sceneEntity } = panelState.value;
        return () => {
            // cleanup entities and state associated with this 3d panel
            removeEntityNodeRecursively(cameraEntity);
            removeEntityNodeRecursively(sceneEntity);
        };
    }, []);

    useEffect(() => {
        if (!canvas.current || canvasRef.value === canvas.current) return;
        canvasRef.set(canvas.current);

        const { cameraEntity, sceneEntity } = panelState.value;

        setComponent(cameraEntity, NameComponent, "3D Preview Camera for " + canvasRef.value.id);

        if (hasComponent(cameraEntity, RendererComponent)) return;

        setComponent(cameraEntity, RendererComponent, {
            canvas: canvasRef.value,
            scenes: [sceneEntity],
        });
        initializeEngineRenderer(cameraEntity);
    }, [canvas.current]);

    return panelState.value;
}
