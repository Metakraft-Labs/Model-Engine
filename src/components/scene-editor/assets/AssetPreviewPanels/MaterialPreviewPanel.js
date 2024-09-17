import React, { useEffect, useRef } from "react";
import { Mesh, SphereGeometry } from "three";

import {
    generateEntityUUID,
    getMutableComponent,
    setComponent,
    useComponent,
    UUIDComponent,
} from "../../../../ecs";
import { EnvmapComponent } from "../../../../engine/scene/components/EnvmapComponent";
import { MaterialSelectionState } from "../../../../engine/scene/materials/MaterialLibraryState";
import { getState, useMutableState } from "../../../../hyperflux";
import { CameraOrbitComponent } from "../../../../spatial/camera/components/CameraOrbitComponent";
import { NameComponent } from "../../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../../spatial/renderer/components/GroupComponent";
import { VisibleComponent } from "../../../../spatial/renderer/components/VisibleComponent";
import { MaterialStateComponent } from "../../../../spatial/renderer/materials/MaterialComponent";
import { getMaterial } from "../../../../spatial/renderer/materials/materialFunctions";
import { useRender3DPanelSystem } from "../../Panel3D/useRender3DPanelSystem";

export const MaterialPreviewCanvas = () => {
    const panelRef = useRef();
    const renderPanel = useRender3DPanelSystem(panelRef);
    const selectedMaterial = useMutableState(MaterialSelectionState).selectedMaterial;
    useEffect(() => {
        if (!selectedMaterial.value) return;
        const { sceneEntity, cameraEntity } = renderPanel;
        setComponent(sceneEntity, NameComponent, "Material Preview Entity");
        const uuid = generateEntityUUID();
        setComponent(sceneEntity, UUIDComponent, uuid);
        setComponent(sceneEntity, VisibleComponent, true);
        const material = getMaterial(getState(MaterialSelectionState).selectedMaterial);
        if (!material) return;
        addObjectToGroup(sceneEntity, new Mesh(new SphereGeometry(5, 32, 32), material));
        setComponent(sceneEntity, EnvmapComponent, { type: "Skybox", envMapIntensity: 2 });
        const orbitCamera = getMutableComponent(cameraEntity, CameraOrbitComponent);
        orbitCamera.focusedEntities.set([sceneEntity]);
        orbitCamera.refocus.set(true);
    }, [
        selectedMaterial,
        useComponent(UUIDComponent.getEntityByUUID(selectedMaterial.value), MaterialStateComponent)
            .material,
    ]);
    return (
        <>
            <div id="materialPreview" style={{ minHeight: "200px", width: "100%", height: "100%" }}>
                <canvas ref={panelRef} style={{ pointerEvents: "all" }} />
            </div>
        </>
    );
};

export const MaterialPreviewPanel = props => {
    const selectedMaterial = useMutableState(MaterialSelectionState).selectedMaterial;
    if (!selectedMaterial.value) return null;
    return <MaterialPreviewCanvas key={selectedMaterial.value} />;
};
