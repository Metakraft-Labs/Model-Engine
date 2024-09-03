import { BufferGeometry, Mesh, Scene } from "three";

import { getComponent } from "../../../ecs";
import { MaterialStateComponent } from "../../../spatial/renderer/materials/MaterialComponent";

import createGLTFExporter from "./createGLTFExporter";

export default async function exportMaterialsGLTF(materialEntities, options) {
    if (materialEntities.length === 0) return;
    const scene = new Scene();
    scene.name = "Root";
    const dudGeo = new BufferGeometry();
    dudGeo.groups = materialEntities.map((_, i) => ({ count: 0, start: 0, materialIndex: i }));
    const materials = materialEntities.map(
        entity => getComponent(entity, MaterialStateComponent).material,
    );
    const lib = new Mesh(dudGeo, materials);
    lib.name = "Materials";
    scene.add(lib);
    const exporter = createGLTFExporter();
    const gltf = await new Promise(resolve => {
        exporter.parse(
            scene,
            resolve,
            e => {
                throw e;
            },
            {
                ...options,
                embedImages: options.binary,
                includeCustomExtensions: true,
            },
        );
    });

    return gltf;
}
