import { Extension, ExtensionProperty, PropertyType } from "@gltf-transform/core";

const EXTENSION_NAME = "MOZ_lightmap";
export class MOZLightmap extends ExtensionProperty {
    static EXTENSION_NAME = EXTENSION_NAME;
    extensionName = typeof EXTENSION_NAME;
    propertyType = "Lightmap";
    parentTypes = [PropertyType.MATERIAL];

    init() {
        this.extensionName = EXTENSION_NAME;
        this.propertyType = "Lightmap";
        this.parentTypes = [PropertyType.MATERIAL];
    }

    getDefaults() {
        return Object.assign(super.getDefaults(), {
            index: -1,
            texCoord: 1,
            intensity: 1,
            extensions: {},
        });
    }

    get intensity() {
        return this.get("intensity");
    }
    set intensity(val) {
        this.set("intensity", val);
    }

    get texCoord() {
        return this.get("texCoord");
    }
    set texCoord(val) {
        this.set("texCoord", val);
    }

    get index() {
        return this.get("index");
    }
    set index(idx) {
        this.set("index", idx);
    }

    get extensions() {
        return this.get("extensions");
    }
    set extensions(exts) {
        this.set("extensions", exts);
    }
}

export class MOZLightmapExtension extends Extension {
    extensionName = EXTENSION_NAME;
    static EXTENSION_NAME = EXTENSION_NAME;

    read(readerContext) {
        const materialDefs = readerContext.jsonDoc.json.materials || [];
        // const textureDefs = readerContext.jsonDoc.json.textures || [];
        materialDefs.forEach((def, idx) => {
            if (def.extensions && def.extensions[EXTENSION_NAME]) {
                const mozLightmap = new MOZLightmap(this.document.getGraph());
                readerContext.materials[idx].setExtension(EXTENSION_NAME, mozLightmap);

                const lightmapDef = def.extensions[EXTENSION_NAME];

                if (lightmapDef.intensity !== undefined) {
                    mozLightmap.intensity = lightmapDef.intensity;
                }
                if (lightmapDef.index !== undefined) {
                    mozLightmap.index = lightmapDef.index;
                }
                if (lightmapDef.texCoord !== undefined) {
                    mozLightmap.texCoord = lightmapDef.texCoord;
                }
                if (lightmapDef.extensions !== undefined) {
                    mozLightmap.extensions = lightmapDef.extensions;
                }
            }
        });
        return this;
    }

    write(writerContext) {
        const json = writerContext.jsonDoc;
        this.document
            .getRoot()
            .listMaterials()
            .forEach(material => {
                const mozLightmap = material.getExtension < MOZLightmap > EXTENSION_NAME;
                if (mozLightmap) {
                    const matIdx = writerContext.materialIndexMap.get(material);
                    const matDef = json.json.materials[matIdx];
                    matDef.extensions = matDef.extensions ?? {};
                    matDef.extensions[EXTENSION_NAME] = {
                        intensity: mozLightmap.intensity,
                        index: mozLightmap.index,
                        texCoord: mozLightmap.texCoord,
                        extensions: mozLightmap.extensions,
                    };
                }
            });
        return this;
    }
}
