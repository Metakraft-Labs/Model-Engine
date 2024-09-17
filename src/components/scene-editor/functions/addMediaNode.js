import { Raycaster, Vector2 } from "three";

import { getContentType } from "../../../common/src/utils/getContentType";
import { UUIDComponent } from "../../../ecs";
import { getComponent, useOptionalComponent } from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { AssetLoaderState } from "../../../engine/assets/state/AssetLoaderState";
import { PositionalAudioComponent } from "../../../engine/audio/components/PositionalAudioComponent";
import { EnvmapComponent } from "../../../engine/scene/components/EnvmapComponent";
import { ImageComponent } from "../../../engine/scene/components/ImageComponent";
import { MediaComponent } from "../../../engine/scene/components/MediaComponent";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { ShadowComponent } from "../../../engine/scene/components/ShadowComponent";
import { VideoComponent } from "../../../engine/scene/components/VideoComponent";
import { VolumetricComponent } from "../../../engine/scene/components/VolumetricComponent";
import { getState, startReactor, useImmediateEffect } from "../../../hyperflux";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import iterateObject3D from "../../../spatial/common/functions/iterateObject3D";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { ObjectLayerComponents } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { ObjectLayerMasks, ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import {
    assignMaterial,
    createMaterialEntity,
} from "../../../spatial/renderer/materials/materialFunctions";
import { EditorControlFunctions } from "./EditorControlFunctions";
import { getIntersectingNodeOnScreen } from "./getIntersectingNode";

/**
 * Adds media node from passed url. Type of the media will be detected automatically
 * @param url URL of the passed media
 * @param parent Parent node will be set as parent to newly created node
 * @param before Newly created node will be set before this node in parent's children array
 * @returns Newly created media node
 */

export async function addMediaNode(url, parent, before, extraComponentJson = []) {
    const contentType = (await getContentType(url)) || "";
    const { hostname } = new URL(url);

    if (contentType.startsWith("model/")) {
        if (contentType.startsWith("model/material")) {
            // find current intersected object
            const objectLayerQuery = defineQuery([ObjectLayerComponents[ObjectLayers.Scene]]);
            const sceneObjects = objectLayerQuery().flatMap(entity =>
                getComponent(entity, GroupComponent),
            );
            //const sceneObjects = Array.from(Engine.instance.objectLayerList[ObjectLayers.Scene] || [])
            const mouse = new Vector2();
            const mouseEvent = event; // Type assertion
            const element = mouseEvent.target;
            let rect = element.getBoundingClientRect();
            mouse.x = ((mouseEvent.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((mouseEvent.clientY - rect.top) / rect.height) * 2 + 1;
            const camera = getComponent(Engine.instance.cameraEntity, CameraComponent);
            const raycaster = new Raycaster();
            raycaster.layers.set(ObjectLayerMasks[ObjectLayers.Scene]);
            const intersections = [];
            getIntersectingNodeOnScreen(raycaster, mouse, intersections);
            // debug code for visualizing ray casts:
            // const rayEntity = createSceneEntity("ray helper", getState(EditorState).rootEntity)
            // const lineStart = raycaster.ray.origin
            // const lineEnd = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(1000))
            // const lineGeometry = new BufferGeometry().setFromPoints([lineStart, lineEnd])
            // setComponent(rayEntity, LineSegmentComponent, { geometry: lineGeometry })
            const gltfLoader = getState(AssetLoaderState).gltfLoader;
            return await new Promise(resolve =>
                gltfLoader.load(url, gltf => {
                    const material = iterateObject3D(
                        gltf.scene,
                        mesh => mesh.material,
                        mesh => mesh?.isMesh,
                    )[0];
                    if (!material) return;
                    const materialEntity = createMaterialEntity(material);
                    let foundTarget = false;
                    for (const intersection of intersections) {
                        iterateObject3D(intersection.object, mesh => {
                            if (!mesh?.isMesh || !mesh.visible) return;
                            assignMaterial(mesh.entity, materialEntity);
                            foundTarget = true;
                        });
                        if (foundTarget) break;
                    }
                    resolve(getComponent(materialEntity, UUIDComponent));
                }),
            );
        } else if (contentType.startsWith("model/lookdev")) {
            const gltfLoader = getState(AssetLoaderState).gltfLoader;
            return await new Promise(resolve =>
                gltfLoader.load(url, gltf => {
                    const componentJson = gltf.scene.children[0].userData.componentJson;
                    EditorControlFunctions.overwriteLookdevObject(
                        [
                            { name: ModelComponent.jsonID, props: { src: url } },
                            ...extraComponentJson,
                        ],
                        componentJson,
                        parent,
                        before,
                    );
                    resolve(null);
                }),
            );
        } else if (contentType.startsWith("model/prefab")) {
            const { entityUUID, sceneID } = EditorControlFunctions.createObjectFromSceneElement(
                [{ name: ModelComponent.jsonID, props: { src: url } }, ...extraComponentJson],
                parent,
                before,
            );
            const reactor = startReactor(() => {
                const entity = UUIDComponent.useEntityByUUID(entityUUID);
                const modelComponent = useOptionalComponent(entity, ModelComponent);

                useImmediateEffect(() => {
                    if (!modelComponent) return;
                    modelComponent.dereference.set(true);
                    reactor.stop();
                }, [modelComponent]);

                return null;
            });
            return entityUUID;
        } else {
            const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
                [
                    { name: ModelComponent.jsonID, props: { src: url } },
                    { name: ShadowComponent.jsonID },
                    { name: EnvmapComponent.jsonID },
                    ...extraComponentJson,
                ],
                parent,
                before,
            );
            return entityUUID;
        }
    } else if (
        contentType.startsWith("video/") ||
        hostname.includes("twitch.tv") ||
        hostname.includes("youtube.com")
    ) {
        const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
            [
                { name: VideoComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
                ...extraComponentJson,
            ],
            parent,
            before,
        );
        return entityUUID;
    } else if (contentType.startsWith("image/")) {
        const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
            [{ name: ImageComponent.jsonID, props: { source: url } }, ...extraComponentJson],
            parent,
            before,
        );
        return entityUUID;
    } else if (contentType.startsWith("audio/")) {
        const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
            [
                { name: PositionalAudioComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
                ...extraComponentJson,
            ],
            parent,
            before,
        );
        return entityUUID;
    } else if (url.includes(".uvol")) {
        const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
            [
                { name: VolumetricComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
                ...extraComponentJson,
            ],
            parent,
            before,
        );
        return entityUUID;
    } else {
        return null;
    }
}
