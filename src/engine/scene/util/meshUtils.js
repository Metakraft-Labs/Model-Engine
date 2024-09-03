import iterateObject3D from "../../../spatial/common/functions/iterateObject3D";

export default function getFirstMesh(obj3d) {
    const meshes = iterateObject3D(
        obj3d,
        child => child,
        child => child?.isMesh,
        false,
        true,
    );
    return meshes.length > 0 ? meshes[0] : null;
}

export function getMeshes(obj3d) {
    return iterateObject3D(
        obj3d,
        child => child,
        child => child?.isMesh,
        false,
        false,
    );
}
