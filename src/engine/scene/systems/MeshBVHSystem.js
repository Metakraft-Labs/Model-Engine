import React, { useEffect } from "react";
import { BufferGeometry, LineBasicMaterial, Matrix4, Mesh, Ray, SkinnedMesh } from "three";
import { computeBoundsTree, disposeBoundsTree, MeshBVHHelper } from "three-mesh-bvh";

import {
    defineSystem,
    PresentationSystemGroup,
    QueryReactor,
    useEntityContext,
} from "../../../ecs";
import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { getMutableState, useHookstate } from "../../../hyperflux";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { RendererState } from "../../../spatial/renderer/RendererState";

import { generateMeshBVH } from "../functions/bvhWorkerPool";

const ray = new Ray();
const tmpInverseMatrix = new Matrix4();
const origMeshRaycastFunc = Mesh.prototype.raycast;

function ValidMeshForBVH(mesh) {
    return mesh !== undefined && mesh.isMesh && !mesh.isInstancedMesh && !mesh.isSkinnedMesh;
}

function convertRaycastIntersect(hit, object, raycaster) {
    if (hit === null) {
        return null;
    }

    hit.point.applyMatrix4(object.matrixWorld);
    hit.distance = hit.point.distanceTo(raycaster.ray.origin);
    hit.object = object;

    if (hit.distance < raycaster.near || hit.distance > raycaster.far) {
        return null;
    } else {
        return hit;
    }
}

function acceleratedRaycast(raycaster, intersects) {
    const mesh = this;
    const geometry = mesh.geometry;
    if (geometry.boundsTree) {
        if (mesh.material === undefined) return;

        tmpInverseMatrix.copy(mesh.matrixWorld).invert();
        ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix);

        const bvh = geometry.boundsTree;
        if (raycaster.firstHitOnly === true) {
            const hit = convertRaycastIntersect(
                bvh.raycastFirst(ray, mesh.material),
                mesh,
                raycaster,
            );
            if (hit) {
                intersects.push(hit);
            }
        } else {
            const hits = bvh.raycast(ray, mesh.material);
            for (let i = 0, l = hits.length; i < l; i++) {
                const hit = convertRaycastIntersect(hits[i], mesh, raycaster);
                if (hit) {
                    intersects.push(hit);
                }
            }
        }
    } else if (!ValidMeshForBVH(mesh) || !hasComponent(mesh.entity, MeshComponent))
        origMeshRaycastFunc.call(mesh, raycaster, intersects);
}

Mesh.prototype.raycast = acceleratedRaycast;
/**
 * @todo we need a fast way to raycast skinned meshes - uncommenting this will cause skinned meshes to intersect and be very slow
 */
SkinnedMesh.prototype.raycast = () => {};

BufferGeometry.prototype["disposeBoundsTree"] = disposeBoundsTree;
BufferGeometry.prototype["computeBoundsTree"] = computeBoundsTree;

const edgeMaterial = new LineBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
});

const MeshBVHReactor = () => {
    const entity = useEntityContext();
    const bvhDebug = useHookstate(getMutableState(RendererState).bvhDebug);
    const mesh = useComponent(entity, MeshComponent);

    useEffect(() => {
        const mesh = getOptionalComponent(entity, MeshComponent);
        if (!mesh) return;
        const abortController = new AbortController();
        if (ValidMeshForBVH(mesh)) {
            generateMeshBVH(mesh, abortController.signal).then(() => {
                if (abortController.signal.aborted) return;
            });
        }
        return () => {
            abortController.abort();
        };
    }, [mesh]);

    useEffect(() => {
        if (!bvhDebug.value) return;

        const mesh = getComponent(entity, MeshComponent);

        const meshBVHVisualizer = new MeshBVHHelper(mesh);
        meshBVHVisualizer.edgeMaterial = edgeMaterial;
        meshBVHVisualizer.depth = 20;
        meshBVHVisualizer.displayParents = false;
        meshBVHVisualizer.update();

        addObjectToGroup(entity, meshBVHVisualizer);

        return () => {
            removeObjectFromGroup(entity, meshBVHVisualizer);
        };
    }, [bvhDebug.value]);

    return null;
};
export const MeshBVHSystem = defineSystem({
    uuid: "ee.engine.MeshBVHSystem",
    insert: { after: PresentationSystemGroup },
    reactor: () => (
        <QueryReactor Components={[MeshComponent]} ChildEntityReactor={MeshBVHReactor} />
    ),
});
