import { Ray } from "@dimforge/rapier3d-compat";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { Euler, Quaternion, Raycaster, Vector3 } from "three";
import { AssetExt, FileToAssetExt } from "../../../common/src/constants/AssetType";
import {
    Engine,
    UUIDComponent,
    UndefinedEntity,
    defineQuery,
    defineSystem,
    getComponent,
    getOptionalComponent,
    removeComponent,
    setComponent,
    useOptionalComponent,
} from "../../../ecs";
import { GLTFComponent } from "../../../engine/gltf/GLTFComponent";
import { GLTFDocumentState, GLTFSnapshotAction } from "../../../engine/gltf/GLTFDocumentState";
import { GLTFSnapshotState } from "../../../engine/gltf/GLTFState";
import { useEntityErrors } from "../../../engine/scene/components/ErrorComponent";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { entityJSONToGLTFNode } from "../../../engine/scene/functions/GLTFConversion";
import { createSceneEntity } from "../../../engine/scene/functions/createSceneEntity";
import { getModelSceneID } from "../../../engine/scene/functions/loaders/ModelFunctions";
import { toEntityJson } from "../../../engine/scene/functions/serializeWorld";
import {
    NO_PROXY,
    defineState,
    dispatchAction,
    getMutableState,
    getState,
    useHookstate,
    useState,
} from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { InputComponent } from "../../../spatial/input/components/InputComponent";
import { InputPointerComponent } from "../../../spatial/input/components/InputPointerComponent";
import { MouseScroll } from "../../../spatial/input/state/ButtonState";
import { Physics } from "../../../spatial/physics/classes/Physics";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { ObjectLayerComponents } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { HolographicMaterial } from "../../../spatial/renderer/materials/prototypes/HolographicMaterial.mat";
import {
    EntityTreeComponent,
    iterateEntityNode,
} from "../../../spatial/transform/components/EntityTree";
import { TransformDirtyCleanupSystem } from "../../../spatial/transform/systems/TransformSystem";
import { EditorControlFunctions } from "../functions/EditorControlFunctions";
import { EditorHelperState, PlacementMode } from "../services/EditorHelperState";
import { EditorState } from "../services/EditorServices";
import { SelectionState } from "../services/SelectionServices";
import { ObjectGridSnapState } from "./ObjectGridSnapSystem";

let placedCount = 0;
export const ClickPlacementState = defineState({
    name: "ClickPlacementState",
    initial: {
        placementEntity: UndefinedEntity,
        selectedAsset: "",
        yawOffset: 0,
        pitchOffset: 0,
        rollOffset: 0,
        maxDistance: 25,
        materialCache: [],
    },
    setSelectedAsset: src => {
        const assetExt = FileToAssetExt(src);
        if (assetExt && (assetExt === AssetExt.GLTF || assetExt === AssetExt.GLB))
            getMutableState(ClickPlacementState).selectedAsset.set(src);
        else {
            // If in click placement mode and non-placeable asset was selected, show warning
            if (getState(EditorHelperState).placementMode === PlacementMode.CLICK) {
                ClickPlacementState.assetError();
            } else ClickPlacementState.resetSelectedAsset();
        }
    },
    resetSelectedAsset: () => {
        getMutableState(ClickPlacementState).selectedAsset.set("");
    },
    assetError: () => {
        toast.warn("Selected asset is not valid for click placement");
        ClickPlacementState.resetSelectedAsset();
    },
});

const ClickPlacementReactor = props => {
    const { parentEntity } = props;
    const clickState = useState(getMutableState(ClickPlacementState));
    const editorState = useState(getMutableState(EditorHelperState));
    const sceneLoaded = GLTFComponent.useSceneLoaded(parentEntity);
    const errors = useEntityErrors(clickState.placementEntity.value, ModelComponent);

    // const renderers = defineQuery([RendererComponent])

    // useEffect(() => {
    //   const placementMode = editorState.placementMode.value
    //   const renderer = getComponent(renderers()[0], RendererComponent)
    //   const canvas = renderer.canvas
    //   if (placementMode === PlacementMode.CLICK) {
    //     canvas.addEventListener('click', clickListener)
    //   } else {
    //     canvas.removeEventListener('click', clickListener)
    //   }
    // }, [editorState.placementMode])

    useEffect(() => {
        if (!sceneLoaded) return;
        if (editorState.placementMode.value === PlacementMode.CLICK) {
            SelectionState.updateSelection([]);
            if (clickState.placementEntity.value) return;
            clickState.placementEntity.set(createPlacementEntity(parentEntity));
        } else {
            if (!clickState.placementEntity.value) return;
            const selectedEntities = getState(SelectionState).selectedEntities.filter(
                uuid => uuid !== getComponent(clickState.placementEntity.value, UUIDComponent),
            );
            EditorControlFunctions.removeObject([clickState.placementEntity.value]);
            clickState.placementEntity.set(UndefinedEntity);
            SelectionState.updateSelection(selectedEntities);
        }
    }, [editorState.placementMode, sceneLoaded]);

    useEffect(() => {
        if (!clickState.placementEntity.value) return;
        const assetURL = clickState.selectedAsset.get(NO_PROXY);
        const placementEntity = clickState.placementEntity.value;
        if (getComponent(placementEntity, ModelComponent)?.src === assetURL) return;
        updatePlacementEntitySnapshot(placementEntity);
    }, [clickState.selectedAsset, clickState.placementEntity]);

    useEffect(() => {
        if (!errors || !errors.value) return;
        ClickPlacementState.assetError();
    }, [errors]);

    return (
        <PlacementModelReactor
            key={clickState.placementEntity.value}
            placementEntity={clickState.placementEntity.value}
        />
    );
};

const PlacementModelReactor = props => {
    const clickState = useState(getMutableState(ClickPlacementState));
    const sceneState = useHookstate(getMutableState(GLTFDocumentState));
    const placementModel = useOptionalComponent(props.placementEntity, ModelComponent);

    useEffect(() => {
        if (!placementModel) return;
        const sceneID = getModelSceneID(props.placementEntity);
        if (!sceneState.scenes[sceneID]) return;
        iterateEntityNode(props.placementEntity, entity => {
            const mesh = getOptionalComponent(entity, MeshComponent);
            if (!mesh) return;
            const material = mesh.material;
            clickState.materialCache.set(prev => [...prev, [mesh, material]]);
            mesh.material = new HolographicMaterial({});
        });
    }, [placementModel?.scene, sceneState.scenes.keys]);

    return null;
};

const objectLayerQuery = defineQuery([ObjectLayerComponents[ObjectLayers.Scene]]);

const getParentEntity = () => {
    return getState(EditorState).rootEntity;
};

const updatePlacementEntitySnapshot = placementEntity => {
    const selectedAsset = getState(ClickPlacementState).selectedAsset;
    if (selectedAsset)
        setComponent(placementEntity, ModelComponent, {
            src: getState(ClickPlacementState).selectedAsset,
        });
    else removeComponent(placementEntity, ModelComponent);

    const sceneID = getComponent(placementEntity, SourceComponent);
    const snapshot = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
    const uuid = getComponent(placementEntity, UUIDComponent);
    const nodeIndex = snapshot.data.nodes?.findIndex(
        value => value.extensions && value.extensions[UUIDComponent.jsonID] === uuid,
    );
    const entityJson = toEntityJson(placementEntity);
    const entityGLTFNode = entityJSONToGLTFNode(entityJson, uuid);
    delete entityGLTFNode.matrix;
    snapshot.data.nodes?.[nodeIndex] = entityGLTFNode;
    dispatchAction(GLTFSnapshotAction.createSnapshot(snapshot));
};

const createPlacementEntitySnapshot = placementEntity => {
    setComponent(placementEntity, ModelComponent, {
        src: getState(ClickPlacementState).selectedAsset,
    });
    const sceneID = getComponent(placementEntity, SourceComponent);
    const snapshot = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
    const uuid = getComponent(placementEntity, UUIDComponent);
    const entityJson = toEntityJson(placementEntity);
    const entityGLTFNode = entityJSONToGLTFNode(entityJson, uuid);
    delete entityGLTFNode.matrix;
    const nodeIndex = snapshot.data.nodes.length;
    snapshot.data.nodes.push(entityGLTFNode);
    snapshot.data.scenes[0].nodes.push(nodeIndex);
    dispatchAction(GLTFSnapshotAction.createSnapshot(snapshot));
};

const createPlacementEntity = parentEntity => {
    const placementEntity = createSceneEntity("Placement-" + placedCount, parentEntity);

    const sceneID = getComponent(parentEntity, SourceComponent);
    setComponent(placementEntity, SourceComponent, sceneID);
    setComponent(placementEntity, EntityTreeComponent, { parentEntity });
    createPlacementEntitySnapshot(placementEntity);

    return placementEntity;
};

const clickListener = () => {
    const clickState = getMutableState(ClickPlacementState);
    if (!clickState.selectedAsset.value) return;
    const parentEntity = getParentEntity();
    if (!parentEntity) return;
    const placementEntity = clickState.placementEntity.value;
    if (!placementEntity) return;

    if (getState(ObjectGridSnapState).enabled) {
        ObjectGridSnapState.apply();
    } else {
        TransformComponent.updateFromWorldMatrix(placementEntity);
        EditorControlFunctions.commitTransformSave([placementEntity]);
    }
    placedCount += 1;
    clickState.placementEntity.set(createPlacementEntity(parentEntity));
    for (const [mesh, material] of clickState.materialCache.value) {
        mesh.material = material;
    }
    clickState.materialCache.set([]);
};

export const ClickPlacementSystem = defineSystem({
    uuid: "ee.studio.ClickPlacementSystem",
    insert: { after: TransformDirtyCleanupSystem },
    reactor: () => {
        const parentEntity = useHookstate(getMutableState(EditorState)).rootEntity;

        return parentEntity.value ? (
            <ClickPlacementReactor key={parentEntity.value} parentEntity={parentEntity.value} />
        ) : null;
    },
    execute: () => {
        const editorHelperState = getState(EditorHelperState);
        if (editorHelperState.placementMode !== PlacementMode.CLICK) return;
        const clickState = getMutableState(ClickPlacementState);
        const placementEntity = clickState.placementEntity;
        if (!placementEntity) return;

        const editorEntity = getState(EditorState).rootEntity;
        const physicsWorld = Physics.getWorld(editorEntity);
        if (!physicsWorld) return;

        //@todo: fix type of `typeof GroupComponent`
        const sceneObjects = [];
        const candidates = objectLayerQuery();
        for (const entity of candidates) {
            const obj = getComponent(entity, GroupComponent)?.[0];
            !!obj && sceneObjects.push(obj);
        }
        //const sceneObjects = Array.from(Engine.instance.objectLayerList[ObjectLayers.Scene] || [])
        const camera = getComponent(Engine.instance.cameraEntity, CameraComponent);
        const pointerScreenRaycaster = new Raycaster();

        let intersectEntity = UndefinedEntity;
        let targetIntersection = null;

        const viewerEntity = Engine.instance.viewerEntity;
        const mouseEntity = InputPointerComponent.getPointersForCamera(viewerEntity)[0];
        if (!mouseEntity) return;

        const buttons = InputComponent.getMergedButtons(viewerEntity);
        const axes = InputComponent.getMergedAxes(viewerEntity);

        const zoom = axes[MouseScroll.VerticalScroll];

        if (buttons.SecondaryClick?.pressed) {
            clickState.maxDistance.set(clickState.maxDistance.value - zoom);
        }

        if (buttons.KeyE?.up) {
            clickState.yawOffset.set(clickState.yawOffset.value + Math.PI / 4);
        }
        if (buttons.KeyQ?.up) {
            clickState.yawOffset.set(clickState.yawOffset.value - Math.PI / 4);
        }
        if (buttons.PrimaryClick?.up) {
            clickListener();
            //Wait until next frame is placement entity changed
            if (placementEntity !== clickState.placementEntity) return;
        }

        const pointer = getComponent(mouseEntity, InputPointerComponent);
        const mouse = pointer.position;
        pointerScreenRaycaster.setFromCamera(mouse, camera); // Assuming 'camera' is your Three.js camera
        const cameraPosition = pointerScreenRaycaster.ray.origin;
        const cameraDirection = pointerScreenRaycaster.ray.direction;
        const physicsIntersection = physicsWorld.castRayAndGetNormal(
            new Ray(cameraPosition, cameraDirection),
            1000,
            false,
        );
        if (physicsIntersection && physicsIntersection.toi < clickState.maxDistance.value) {
            const intersectPosition = cameraPosition
                .clone()
                .add(cameraDirection.clone().multiplyScalar(physicsIntersection.toi));
            intersectEntity = physicsIntersection.collider.parent().userData.entity;
            const intersectNormal = new Vector3(
                physicsIntersection.normal.x,
                physicsIntersection.normal.y,
                physicsIntersection.normal.z,
            );
            targetIntersection = {
                point: intersectPosition,
                normal: intersectNormal,
            };
        }
        const intersect = pointerScreenRaycaster.intersectObjects(sceneObjects, false);
        //if (intersect.length === 0 && !targetIntersection) return
        for (let i = 0; i < intersect.length; i++) {
            const intersected = intersect[i];
            if (intersected.distance > clickState.maxDistance.value) continue;
            if (isPlacementDescendant(intersected.object.entity)) continue;
            targetIntersection = {
                point: intersected.point,
                normal: intersected.face?.normal ?? new Vector3(0, 1, 0),
            };
            break;
        }

        if (!targetIntersection) {
            const point = cameraPosition
                .clone()
                .add(cameraDirection.clone().multiplyScalar(clickState.maxDistance.value));
            targetIntersection = { point, normal: new Vector3(0, 1, 0) };
        }
        const position = targetIntersection.point;
        let rotation = new Quaternion().setFromUnitVectors(
            new Vector3(),
            targetIntersection.normal ?? new Vector3(0, 1, 0),
        );
        const offset = new Quaternion().setFromEuler(
            new Euler(
                clickState.pitchOffset.value,
                clickState.yawOffset.value,
                clickState.rollOffset.value,
            ),
        );
        rotation = offset.multiply(rotation);
        setComponent(placementEntity.value, TransformComponent, { position, rotation });
    },
});

const isPlacementDescendant = entity => {
    const placementEntity = getState(ClickPlacementState).placementEntity;
    if (!placementEntity) return false;
    let walker = entity;
    while (walker) {
        if (walker === placementEntity) return true;
        walker = getComponent(walker, EntityTreeComponent)?.parentEntity ?? null;
    }
    return false;
};
