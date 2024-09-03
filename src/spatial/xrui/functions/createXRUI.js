import React from "react";
import { createRoot } from "react-dom/client";
import { Group } from "three";

import { getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { EntityContext, createEntity } from "../../../ecs/EntityFunctions";
import { getState } from "../../../hyperflux";
import { WebContainer3D } from "../../../xrui/core/three/WebContainer3D";
import { WebLayerManager } from "../../../xrui/core/three/WebLayerManager";

import { AssetLoaderState } from "../../../engine/assets/state/AssetLoaderState";
import { EngineState } from "../../EngineState";
import { InputComponent } from "../../input/components/InputComponent";
import { RendererComponent } from "../../renderer/WebGLRendererSystem";
import { addObjectToGroup } from "../../renderer/components/GroupComponent";
import { setObjectLayers } from "../../renderer/components/ObjectLayerComponent";
import { VisibleComponent } from "../../renderer/components/VisibleComponent";
import { ObjectLayers } from "../../renderer/constants/ObjectLayers";
import { DistanceFromCameraComponent } from "../../transform/components/DistanceComponents";
import { XRUIStateContext } from "../XRUIStateContext";
import { XRUIComponent } from "../components/XRUIComponent";

export function createXRUI(
    UIFunc,
    state = null,
    settings = { interactable: true },
    entity = createEntity(),
) {
    const containerElement = document.createElement("div");
    containerElement.style.position = "fixed";
    containerElement.id = "xrui-" + UIFunc.name;

    const rootElement = createRoot(containerElement);
    rootElement.render(
        //@ts-ignore
        <EntityContext.Provider value={entity}>
            {/* 
      // @ts-ignore */}
            <XRUIStateContext.Provider value={state}>
                <UIFunc />
            </XRUIStateContext.Provider>
        </EntityContext.Provider>,
    );

    if (!WebLayerManager.instance) {
        const viewerEntity = getState(EngineState).viewerEntity;
        const renderer = getComponent(viewerEntity, RendererComponent);
        const gltfLoader = getState(AssetLoaderState).gltfLoader;
        WebLayerManager.initialize(renderer.renderer, gltfLoader.ktx2Loader);
    }

    const container = new WebContainer3D(containerElement, { manager: WebLayerManager.instance });

    container.raycaster.layers.enableAll();

    const root = new Group();
    root.name = containerElement.id;
    root.add(container);
    addObjectToGroup(entity, root);
    setObjectLayers(container, ObjectLayers.UI);
    setComponent(entity, DistanceFromCameraComponent);
    setComponent(entity, XRUIComponent, container);
    setComponent(entity, VisibleComponent, true);
    if (settings.interactable)
        setComponent(entity, InputComponent, { highlight: false, grow: true });

    return { entity, state, container };
}
