import { Box3, BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import Worker from "web-worker";
import { WorkerPool } from "../../../xrui/core/WorkerPool";

const createWorker = () => {
    return new Worker("/workers/generateBVHAsync.worker.js");
};

const workerPool = new WorkerPool(1);
workerPool.setWorkerCreator(createWorker);

export async function generateMeshBVH(mesh, signal, options = {}) {
    if (
        !mesh.isMesh ||
        mesh.isInstancedMesh ||
        !mesh.geometry ||
        !mesh.geometry.attributes.position ||
        mesh.geometry.boundsTree
    )
        return Promise.resolve();

    const geometry = mesh.geometry;

    const index = geometry.index ? Uint32Array.from(geometry.index.array) : undefined;
    const pos = Float32Array.from(geometry.attributes.position.array);

    const transferrables = [pos];
    if (index) {
        transferrables.push(index);
    }

    const response = await workerPool.postMessage(
        {
            index,
            position: pos,
            options,
        },
        transferrables.map(arr => arr.buffer),
    );

    const { serialized, error } = response.data;

    if (error) {
        return console.error(error);
    } else {
        // MeshBVH uses generated index instead of default geometry index
        geometry.setIndex(new BufferAttribute(serialized.index, 1));

        const bvh = MeshBVH.deserialize(serialized, geometry);
        const boundsOptions = Object.assign(
            {
                setBoundingBox: true,
            },
            options,
        );

        if (boundsOptions.setBoundingBox) {
            geometry.boundingBox = bvh.getBoundingBox(new Box3());
        }

        geometry.boundsTree = bvh;

        return bvh;
    }
}
