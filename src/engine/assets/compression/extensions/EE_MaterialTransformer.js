import { Extension, ExtensionProperty, Property, PropertyType } from "@gltf-transform/core";

const EXTENSION_NAME = "EE_material";

export class EEMaterialArgs extends Property {
    propertyType = "EEMaterialArgs";
    parentTypes = ["EEMaterial"];
    init() {
        this.propertyType = "EEMaterialArgs";
        this.parentTypes = ["EEMaterial"];
    }

    getDefaults() {
        return Object.assign(super.getDefaults(), {
            extras: {},
        });
    }

    getProp(field) {
        return this.get(field);
    }

    getPropRef(field) {
        return this.getRef(field);
    }

    setProp(field, value) {
        this.set(field, value);
    }
    setPropRef(field, value) {
        this.setRef(field, value);
    }
}

export class EEArgEntry extends Property {
    propertyType = "EEMaterialArgEntry";
    parentTypes = ["EEMaterialArgs"];
    init() {
        this.propertyType = "EEMaterialArgEntry";
        this.parentTypes = ["EEMaterialArgs"];
    }

    getDefaults() {
        return Object.assign(super.getDefaults(), {
            name: "",
            type: "",
            contents: null,
            extras: {},
        });
    }

    get type() {
        return this.get("type");
    }
    set type(val) {
        this.set("type", val);
    }
    get contents() {
        return this.get("contents");
    }
    set contents(val) {
        this.set("contents", val);
    }
}

export class EEMaterial extends ExtensionProperty {
    static EXTENSION_NAME = EXTENSION_NAME;
    extensionName = typeof EXTENSION_NAME;
    propertyType = "EEMaterial";
    parentTypes = [PropertyType.MATERIAL];

    init() {
        this.extensionName = EXTENSION_NAME;
        this.propertyType = "EEMaterial";
        this.parentTypes = [PropertyType.MATERIAL];
    }

    getDefaults() {
        return Object.assign(super.getDefaults(), {
            uuid: "",
            name: "",
            prototype: "",
            args: null,
            plugins: [],
        });
    }

    get uuid() {
        return this.get("uuid");
    }
    set uuid(val) {
        this.set("uuid", val);
    }
    get name() {
        return this.get("name");
    }
    set name(val) {
        this.set("name", val);
    }
    get prototype() {
        return this.get("prototype");
    }
    set prototype(val) {
        this.set("prototype", val);
    }
    get args() {
        return this.getRef("args");
    }
    set args(val) {
        this.setRef("args", val);
    }
    get plugins() {
        return this.get("plugins");
    }
    set plugins(val) {
        this.set("plugins", val);
    }
}

export class EEMaterialExtension extends Extension {
    extensionName = EXTENSION_NAME;
    static EXTENSION_NAME = EXTENSION_NAME;

    textures = [];
    textureExtensions = [];

    textureInfoMap = new Map();
    materialInfoMap = new Map();
    read(readerContext) {
        const materialDefs = readerContext.jsonDoc.json.materials || [];
        let textureUuidIndex = 0;
        let materialUuidIndex = 0;
        materialDefs.map((def, idx) => {
            if (def.extensions?.[EXTENSION_NAME]) {
                const eeMaterial = new EEMaterial(this.document.getGraph());
                readerContext.materials[idx].setExtension(EXTENSION_NAME, eeMaterial);

                const eeDef = def.extensions[EXTENSION_NAME];

                if (eeDef.uuid) {
                    eeMaterial.uuid = eeDef.uuid;
                }
                if (eeDef.name) {
                    eeMaterial.name = eeDef.name;
                }
                if (eeDef.prototype) {
                    eeMaterial.prototype = eeDef.prototype;
                }
                if (eeDef.args) {
                    //eeMaterial.args = eeDef.args
                    const processedArgs = new EEMaterialArgs(this.document.getGraph());
                    const materialArgsInfo = Object.keys(eeDef.args);
                    const materialUuid = materialUuidIndex.toString();
                    materialUuidIndex++;
                    this.materialInfoMap.set(materialUuid, materialArgsInfo);
                    processedArgs.setExtras({ uuid: materialUuid });
                    Object.entries(eeDef.args).map(([field, argDef]) => {
                        const nuArgDef = new EEArgEntry(this.document.getGraph());
                        nuArgDef.type = argDef.type;
                        if (argDef.type === "texture") {
                            const value = argDef.contents;
                            const texture = value ? readerContext.textures[value.index] : null;
                            if (texture) {
                                const textureInfo = new TextureInfo(this.document.getGraph());
                                readerContext.setTextureInfo(textureInfo, value);
                                const uuid = textureUuidIndex.toString();
                                if (texture.getExtras().uuid === undefined) {
                                    texture.setExtras({ uuid });
                                    textureUuidIndex++;
                                    this.textures.push(texture);
                                    this.textureExtensions.push(texture.listExtensions());
                                }
                                if (texture && value.extensions?.KHR_texture_transform) {
                                    const extensionData = value.extensions.KHR_texture_transform;
                                    const transform = new KHRTextureTransform(
                                        this.document,
                                    ).createTransform();
                                    extensionData.offset &&
                                        transform.setOffset(extensionData.offset);
                                    extensionData.scale && transform.setScale(extensionData.scale);
                                    extensionData.rotation &&
                                        transform.setRotation(extensionData.rotation);
                                    extensionData.texCoord &&
                                        transform.setTexCoord(extensionData.texCoord);
                                    textureInfo.setExtension("KHR_texture_transform", transform);
                                }
                                this.textureInfoMap.set(uuid, textureInfo);
                            }
                            nuArgDef.contents = texture;
                            processedArgs.setPropRef(field, nuArgDef);
                        } else {
                            nuArgDef.contents = argDef.contents;
                            processedArgs.setProp(field, nuArgDef);
                        }
                    });
                    eeMaterial.args = processedArgs;
                }
                if (eeDef.plugins) {
                    eeMaterial.plugins = eeDef.plugins;
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
            .map(material => {
                const eeMaterial = material.getExtension(EXTENSION_NAME);
                if (eeMaterial) {
                    const matIdx = writerContext.materialIndexMap.get(material);
                    const matDef = json.json.materials[matIdx];
                    const extensionDef = {
                        uuid: eeMaterial.uuid,
                        name: eeMaterial.name,
                        prototype: eeMaterial.prototype,
                        plugins: eeMaterial.plugins,
                    };
                    const matArgs = eeMaterial.args;
                    if (matArgs) {
                        extensionDef.args = {};
                        const materialArgsInfo = this.materialInfoMap.get(matArgs.getExtras().uuid);
                        materialArgsInfo.map(field => {
                            let value;
                            try {
                                value = matArgs.getPropRef(field);
                            } catch (e) {
                                value = matArgs.getProp(field);
                            }
                            if (value.type === "texture") {
                                const argEntry = new EEArgEntry(this.document.getGraph());
                                argEntry.type = "texture";
                                const texture = value.contents;
                                if (texture) {
                                    const uuid = texture.getExtras().uuid;
                                    const textureInfo = this.textureInfoMap.get(uuid);
                                    const docTexture = this.document
                                        .getRoot()
                                        .listTextures()
                                        .find(t => t.getExtras().uuid === uuid);
                                    argEntry.contents = writerContext.createTextureInfoDef(
                                        docTexture,
                                        textureInfo,
                                    );
                                } else {
                                    argEntry.contents = null;
                                }
                                extensionDef.args[field] = {
                                    type: argEntry.type,
                                    contents: argEntry.contents,
                                };
                            } else {
                                extensionDef.args[field] = {
                                    type: value.type,
                                    contents: value.contents,
                                };
                            }
                        });
                    }
                    matDef.extensions = matDef.extensions || {};
                    matDef.extensions[EXTENSION_NAME] = extensionDef;
                }
            });
        return this;
    }
}
