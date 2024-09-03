import { ExporterExtension } from "./ExporterExtension";

export default class ResourceIDExtension extends ExporterExtension {
    constructor(writer) {
        super(writer);
        this.name = "EE_resourceId";
    }

    writeTexture(map, textureDef) {
        const result = {
            resourceId: map.image.id,
        };
        textureDef.extensions = textureDef.extensions ?? {};
        textureDef.extensions[this.name] = result;
        this.writer.extensionsUsed[this.name] = true;
    }

    writeMesh(mesh, meshDef) {
        const result = {
            resourceId: mesh.geometry.uuid,
        };
        meshDef.extensions = meshDef.extensions ?? {};
        meshDef.extensions[this.name] = result;
        this.writer.extensionsUsed[this.name] = true;
    }
}
