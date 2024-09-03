import { ExtensionProperty, PropertyType } from "@gltf-transform/core";

const EXTENSION_NAME = "EE_resourceId";

export class EEResourceID extends ExtensionProperty {
    static EXTENSION_NAME = EXTENSION_NAME;
    extensionName = typeof EXTENSION_NAME;
    propertyType = "EEResourceID";
    parentTypes = [PropertyType.TEXTURE, PropertyType.PRIMITIVE];

    init() {
        this.extensionName = EXTENSION_NAME;
        this.propertyType = "EEResourceID";
        this.parentTypes = [PropertyType.TEXTURE, PropertyType.PRIMITIVE];
    }

    getDefaults() {
        return Object.assign(super.getDefaults(), {
            resourceId: "",
        });
    }

    get resourceId() {
        return this.get("resourceId");
    }

    set resourceId(resourceId) {
        this.set("resourceId", resourceId);
    }
}

export class EEResourceIDExtension extends Extension {
    extensionName = EXTENSION_NAME;
    static EXTENSION_NAME = EXTENSION_NAME;

    read(readerContext) {
        const jsonDoc = readerContext.jsonDoc;
        (jsonDoc.json.textures || []).map((def, idx) => {
            if (def.extensions?.[EXTENSION_NAME]) {
                const eeResourceID = new EEResourceID(this.document.getGraph());
                readerContext.textures[idx].setExtension(EXTENSION_NAME, eeResourceID);
                const eeDef = def.extensions[EXTENSION_NAME];
                eeDef.resourceId && (eeResourceID.resourceId = eeDef.resourceId);
            }
        });
        return this;
    }

    write(writerContext) {
        const jsonDoc = writerContext.jsonDoc;
        this.document
            .getRoot()
            .listTextures()
            .map((texture, index) => {
                const eeResourceID = texture.getExtension(EXTENSION_NAME);
                if (!eeResourceID) return;
                const textureDef = jsonDoc.json.textures[index];
            });
        return this;
    }
}
