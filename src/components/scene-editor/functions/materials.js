export function forEachMaterial(mesh, fn) {
    if (!mesh.material) return;

    if (Array.isArray(mesh.material)) {
        mesh.material.forEach(fn);
    } else {
        fn(mesh.material);
    }
}

export function traverseMaterials(mesh, fn) {
    mesh.traverse(m => forEachMaterial(m, fn));
}

export function collectUniqueMaterials(mesh) {
    const materials = new Set();
    traverseMaterials(mesh, material => materials.add(material));
    return Array.from(materials);
}
