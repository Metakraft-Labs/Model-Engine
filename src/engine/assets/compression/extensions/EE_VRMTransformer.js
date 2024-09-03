import { Extension } from "@gltf-transform/core";

const EXTENSION_NAME = "VRM";

export class VRMExtension extends Extension {
    extensionName = EXTENSION_NAME;
    static EXTENSION_NAME = EXTENSION_NAME;

    vrm = null;

    read(readerContext) {
        if (readerContext.jsonDoc.json.extensions?.[EXTENSION_NAME]) {
            this.vrm = readerContext.jsonDoc.json.extensions[EXTENSION_NAME];
        }
        return this;
    }

    write(writerContext) {
        if (this.vrm !== null) {
            writerContext.jsonDoc.json.extensions ??= {};
            writerContext.jsonDoc.json.extensions[EXTENSION_NAME] = this.vrm;
        }
        return this;
    }
}
