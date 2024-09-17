import { Object3D, Vector3 } from "three";
import {
    defineQuery,
    Engine,
    getComponent,
    getOptionalComponent,
    hasComponent,
    Not,
    UndefinedEntity,
    UUIDComponent,
} from "../../../ecs";
import { InteractableComponent } from "../../../engine/interaction/components/InteractableComponent";
import { getState } from "../../../hyperflux";
import { Object3DUtils } from "../../../shared/Object3DUtils";
import { CameraComponent } from "../../camera/components/CameraComponent";
import { ObjectDirection } from "../../common/constants/MathConstants";
import { EngineState } from "../../EngineState";
import { Physics } from "../../physics/classes/Physics";
import { GroupComponent } from "../../renderer/components/GroupComponent";
import { MeshComponent } from "../../renderer/components/MeshComponent";
import { SceneComponent } from "../../renderer/components/SceneComponents";
import { VisibleComponent } from "../../renderer/components/VisibleComponent";
import { ObjectLayers } from "../../renderer/constants/ObjectLayers";
import { BoundingBoxComponent } from "../../transform/components/BoundingBoxComponents";
import {
    TransformComponent,
    TransformGizmoTagComponent,
} from "../../transform/components/TransformComponent";
import { XRScenePlacementComponent } from "../../xr/XRScenePlacementComponent";
import { XRState } from "../../xr/XRState";
import { XRUIComponent } from "../../xrui/components/XRUIComponent";
import { InputComponent } from "../components/InputComponent";
import { InputState } from "../state/InputState";

const _worldPosInputSourceComponent = new Vector3();
const _worldPosInputComponent = new Vector3();

/**Proximity query */
const spatialInputObjectsQuery = defineQuery([
    InputComponent,
    VisibleComponent,
    TransformComponent,
    Not(CameraComponent),
    Not(XRScenePlacementComponent),
]);

export function findProximity(isSpatialInput, sourceEid, sortedIntersections, intersectionData) {
    const isCameraAttachedToAvatar = XRState.isCameraAttachedToAvatar;

    //use sourceEid if controller (one InputSource per controller), otherwise use avatar rather than InputSource-emulated-pointer
    const selfAvatarEntity = UUIDComponent.getEntityByUUID(Engine.instance.userID + "_avatar"); //would prefer a better way to do this
    const inputSourceEntity =
        isCameraAttachedToAvatar && isSpatialInput ? sourceEid : selfAvatarEntity;

    // Skip Proximity Heuristic when the entity is undefined
    if (inputSourceEntity === UndefinedEntity) return;

    TransformComponent.getWorldPosition(inputSourceEntity, _worldPosInputSourceComponent);

    //TODO spatialInputObjects or inputObjects?  - inputObjects requires visible and group components
    for (const inputEntity of spatialInputObjectsQuery()) {
        if (inputEntity === selfAvatarEntity) continue;
        const inputComponent = getComponent(inputEntity, InputComponent);

        TransformComponent.getWorldPosition(inputEntity, _worldPosInputComponent);
        const distSquared =
            _worldPosInputSourceComponent.distanceToSquared(_worldPosInputComponent);

        //closer than our current closest AND within inputSource's activation distance
        if (inputComponent.activationDistance * inputComponent.activationDistance > distSquared) {
            //using this object type out of convenience (intersectionsData is also guaranteed empty in this flow)
            intersectionData.add({ entity: inputEntity, distance: distSquared }); //keeping it as distSquared for now to avoid extra square root calls
        }
    }

    const closestEntities = Array.from(intersectionData);
    if (closestEntities.length === 0) return;
    if (closestEntities.length > 1) {
        //sort if more than 1 entry
        closestEntities.sort((a, b) => {
            //prioritize anything with an InteractableComponent if otherwise equal
            const aNum = hasComponent(a.entity, InteractableComponent) ? -1 : 0;
            const bNum = hasComponent(b.entity, InteractableComponent) ? -1 : 0;
            //aNum - bNum : 0 if equal, -1 if a has tag and b doesn't, 1 if a doesnt have tag and b does
            return Math.sign(a.distance - b.distance) + (aNum - bNum);
        });
    }
    sortedIntersections.push({
        entity: closestEntities[0].entity,
        distance: Math.sqrt(closestEntities[0].distance),
    });
}

/**Editor InputComponent raycast query */
const inputObjectsQuery = defineQuery([InputComponent, VisibleComponent, GroupComponent]);

/** @todointo heuristic api */
const gizmoPickerObjectsQuery = defineQuery([
    InputComponent,
    GroupComponent,
    VisibleComponent,
    TransformGizmoTagComponent,
]);

export function findEditor(intersectionData, caster) {
    const pickerObj = gizmoPickerObjectsQuery(); // gizmo heuristic
    const inputObj = inputObjectsQuery();

    const objects = (pickerObj.length > 0 ? pickerObj : inputObj) // gizmo heuristic
        .map(eid => getComponent(eid, GroupComponent))
        .flat();
    pickerObj.length > 0
        ? caster.layers.enable(ObjectLayers.TransformGizmo)
        : caster.layers.disable(ObjectLayers.TransformGizmo);
    const hits = caster.intersectObjects < Object3D > (objects, true);
    for (const hit of hits) {
        const parentObject = Object3DUtils.findAncestor(hit.object, obj => !obj.parent);
        if (parentObject?.entity) {
            intersectionData.add({ entity: parentObject.entity, distance: hit.distance });
        }
    }
}

const xruiQuery = defineQuery([VisibleComponent, XRUIComponent]);

export function findXRUI(intersectionData, ray) {
    for (const entity of xruiQuery()) {
        const xrui = getComponent(entity, XRUIComponent);
        const layerHit = xrui.hitTest(ray);
        if (
            !layerHit ||
            !layerHit.intersection.object.visible ||
            layerHit.intersection.object.material?.opacity < 0.01
        )
            continue;
        intersectionData.add({ entity, distance: layerHit.intersection.distance });
    }
}

const sceneQuery = defineQuery([SceneComponent]);

export function findPhysicsColliders(intersectionData, raycast) {
    for (const entity of sceneQuery()) {
        const world = Physics.getWorld(entity);
        if (!world) continue;

        const hits = Physics.castRay(world, raycast);
        for (const hit of hits) {
            if (!hit.entity) continue;
            intersectionData.add({ entity: hit.entity, distance: hit.distance });
        }
    }
}

// const boundingBoxesQuery = defineQuery([VisibleComponent, BoundingBoxComponent]);

export function findBBoxes(intersectionData, ray, hitTarget) {
    const inputState = getState(InputState);
    for (const entity of inputState.inputBoundingBoxes) {
        const boundingBox = getOptionalComponent(entity, BoundingBoxComponent);
        if (!boundingBox) continue;
        const hit = ray.intersectBox(boundingBox.box, hitTarget);
        if (hit) {
            intersectionData.add({ entity, distance: ray.origin.distanceTo(hitTarget) });
        }
    }
}

const meshesQuery = defineQuery([VisibleComponent, MeshComponent]);

export function findMeshes(intersectionData, isEditing, caster) {
    const inputState = getState(InputState);
    const objects = (isEditing ? meshesQuery() : Array.from(inputState.inputMeshes)) // gizmo heuristic
        .filter(eid => hasComponent(eid, GroupComponent))
        .map(eid => getComponent(eid, GroupComponent))
        .flat();

    const hits = caster.intersectObjects < Object3D > (objects, true);
    for (const hit of hits) {
        const parentObject = Object3DUtils.findAncestor(hit.object, obj => obj.entity != undefined);
        if (parentObject) {
            intersectionData.add({ entity: parentObject.entity, distance: hit.distance });
        }
    }
}

export function findRaycastedInput(sourceEid, intersectionData, data, heuristic) {
    const sourceRotation = TransformComponent.getWorldRotation(sourceEid, data.quaternion);
    data.raycast.direction.copy(ObjectDirection.Forward).applyQuaternion(sourceRotation);

    TransformComponent.getWorldPosition(sourceEid, data.raycast.origin).addScaledVector(
        data.raycast.direction,
        -0.01,
    );
    data.ray.set(data.raycast.origin, data.raycast.direction);
    data.caster.set(data.raycast.origin, data.raycast.direction);
    data.caster.layers.enable(ObjectLayers.Scene);

    const isEditing = getState(EngineState).isEditing;
    // only heuristic is scene objects when in the editor
    if (isEditing) {
        heuristic.editor(intersectionData, data.caster);
    } else {
        // 1st heuristic is XRUI
        heuristic.xrui(intersectionData, data.ray);
        // 2nd heuristic is physics colliders
        heuristic.physicsColliders(intersectionData, data.raycast);

        // 3rd heuristic is bboxes
        heuristic.bboxes(intersectionData, data.ray, data.hitTarget);
    }
    // 4th heuristic is meshes
    heuristic.meshes(intersectionData, isEditing, data.caster);
}

export const ClientInputHeuristics = {
    findProximity,
    findEditor,
    findXRUI,
    findPhysicsColliders,
    findBBoxes,
    findMeshes,
    findRaycastedInput,
};
export default ClientInputHeuristics;
