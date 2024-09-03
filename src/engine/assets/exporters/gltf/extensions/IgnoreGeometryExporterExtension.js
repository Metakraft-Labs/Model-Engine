import { getComponent, hasComponent, removeComponent } from "../../../../../ecs";
import { MeshComponent } from "../../../../../spatial/renderer/components/MeshComponent";
import { iterateEntityNode } from "../../../../../spatial/transform/components/EntityTree";

import { ImageComponent } from "../../../../scene/components/ImageComponent";
import { PrimitiveGeometryComponent } from "../../../../scene/components/PrimitiveGeometryComponent";
import { ExporterExtension } from "./ExporterExtension";

export default class IgnoreGeometryExporterExtension extends ExporterExtension {
    entitySet;
    meshSet;
    constructor(writer) {
        super(writer);
        this.name = "EE_ignoreGeometry";
        this.entitySet = [];
        this.meshSet = [];
    }
    beforeParse(input) {
        const root = Array.isArray(input) ? input[0] : input;

        iterateEntityNode(root.entity, entity => {
            if (!hasComponent(entity, MeshComponent)) return;
            const mesh = getComponent(entity, MeshComponent);
            const removeMesh =
                hasComponent(entity, PrimitiveGeometryComponent) ||
                hasComponent(entity, GroundPlaneComponent) ||
                hasComponent(entity, ImageComponent) ||
                !!mesh.userData["ignoreOnExport"];
            if (!removeMesh) return;
            removeComponent(entity, MeshComponent);
        });
    }
}
