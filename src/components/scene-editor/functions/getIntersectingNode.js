import { defineQuery } from "../../../ecs";
import { getComponent } from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { getState } from "../../../hyperflux";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { GroupComponent } from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";

import { SelectionState } from "../services/SelectionServices";

function getParentEntity(obj) {
    let curObj = obj;

    while (curObj) {
        if (curObj.entity) break;
        curObj = curObj.parent;
    }

    return curObj;
}

export function getIntersectingNode(results) {
    if (results.length <= 0) return;
    const selectionState = getState(SelectionState);
    const selected = new Set()(selectionState.selectedEntities);
    for (const result of results) {
        const obj = result.object; //getParentEntity(result.object)
        const parentNode = getParentEntity(obj);
        if (!parentNode) continue; //skip obj3ds that are not children of EntityNodes
        if (!obj.entity && parentNode && !selected.has(parentNode.entity)) {
            result.node = parentNode.entity;
            result.obj3d = getComponent(parentNode.entity, GroupComponent)[0];
            return result;
        }

        if (obj) {
            result.obj3d = obj;
            result.node = obj.entity;
            //if(result.node && hasComponent(result.node.entity, GroupComponent))
            //result.obj3d = result.object
            //result.node = result.object.uuid
            return result;
        }
    }
}

export const getIntersectingNodeOnScreen = (
    raycaster,
    coord,
    target = [],
    camera = getComponent(Engine.instance.cameraEntity, CameraComponent),
    object,
    recursive = true,
) => {
    raycaster.setFromCamera(coord, camera);
    raycaster.layers.enable(ObjectLayers.NodeHelper);
    raycaster.intersectObjects(
        object ? [object] : allMeshes().map(e => getComponent(e, MeshComponent)),
        recursive,
        target,
    );
    raycaster.layers.disable(ObjectLayers.NodeHelper);
    return getIntersectingNode(target);
};

const allMeshes = defineQuery([MeshComponent]);
