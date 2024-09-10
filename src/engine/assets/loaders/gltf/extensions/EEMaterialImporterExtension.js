import { Color, SRGBColorSpace } from "three";
import matches from "ts-matches";

import { getComponent, UUIDComponent } from "../../../../../ecs";
import {
    MaterialPrototypeComponent,
    MaterialStateComponent,
} from "../../../../../spatial/renderer/materials/MaterialComponent";

import {
    getPrototypeEntityFromName,
    injectMaterialDefaults,
    PrototypeNotFoundError,
} from "../../../../../spatial/renderer/materials/materialFunctions";
import { isOldEEMaterial } from "../../../exporters/gltf/extensions/EEMaterialExporterExtension";
import { ImporterExtension } from "./ImporterExtension";

export class EEMaterialImporterExtension extends ImporterExtension {
    name = "EE_material";

    getMaterialType(materialIndex) {
        const parser = this.parser;
        const materialDef = parser.json.materials[materialIndex];
        if (!materialDef.extensions?.[this.name]) return null;
        const eeMaterialType = materialDef.extensions[this.name];
        let constructor = null;
        try {
            constructor = getComponent(
                getPrototypeEntityFromName(eeMaterial.prototype),
                MaterialPrototypeComponent,
            ).prototypeConstructor;
        } catch (e) {
            if (e instanceof PrototypeNotFoundError) {
                console.warn("prototype " + eeMaterial.prototype + " not found");
            } else {
                throw e;
            }
        }
        return constructor
            ? function (args) {
                  const material = new constructor[eeMaterial.prototype](args);
                  typeof eeMaterial.uuid === "string" && (material.uuid = eeMaterial.uuid);
                  return material;
              }
            : null;
    }

    extendMaterialParams(materialIndex, materialParams) {
        const parser = this.parser;
        const materialDef = parser.json.materials[materialIndex];
        if (!materialDef.extensions?.[this.name]) return Promise.resolve();
        const extensionType = materialDef.extensions[this.name];
        if (extension.plugins) {
            if (!materialDef.extras) materialDef.extras = {};
            materialDef.extras["plugins"] = extension.plugins;
            for (const plugin of extension.plugins) {
                if (!plugin?.uniforms) continue;
                for (const v of Object.values(plugin.uniforms)) {
                    if (v.type === "texture") {
                        parser.assignTexture(materialParams, v.name, v.contents);
                    }
                }
            }
        }
        const materialComponent = getComponent(
            UUIDComponent.getEntityByUUID(extension.uuid),
            MaterialStateComponent,
        );
        let foundPrototype = false;
        if (materialComponent) {
            foundPrototype = !!materialComponent.prototypeEntity;
            injectMaterialDefaults(extension.uuid);
        } else {
            try {
                getComponent(
                    getPrototypeEntityFromName(extension.prototype),
                    MaterialPrototypeComponent,
                ).prototypeArguments;
                foundPrototype = true;
            } catch (e) {
                if (e instanceof PrototypeNotFoundError) {
                    console.warn("prototype " + extension.prototype + " not found");
                } else {
                    throw e;
                }
            }
        }
        if (!foundPrototype) {
            materialDef.extras = materialDef.extras || {};
            materialDef.extras["args"] = extension.args;
        }
        //if we found a prototype, we populate the materialParams as normal.
        //if we didn't find a prototype, we populate the materialDef.extras.args to hold for later.
        const parseTarget = foundPrototype ? materialParams : materialDef.extras.args;
        if (isOldEEMaterial(extension)) {
            const oldExtension = extension;
            return Promise.all(
                Object.entries(oldExtension.args).map(async ([k, v]) => {
                    //check if the value is a texture
                    if (matches.shape({ index: matches.number }).test(v)) {
                        if (k === "map") {
                            await parser.assignTexture(parseTarget, k, v, SRGBColorSpace);
                        } else {
                            await parser.assignTexture(parseTarget, k, v);
                        }
                    }
                    //check if the value is a color by checking key
                    else if (
                        (k.toLowerCase().includes("color") || k === "emissive") &&
                        typeof v === "number"
                    ) {
                        parseTarget[k] = new Color(v);
                    }
                    //otherwise, just assign the value
                    else {
                        parseTarget[k] = v;
                    }
                }),
            );
        }
        return Promise.all(
            Object.entries(extension.args).map(async ([k, v]) => {
                switch (v.type) {
                    case undefined:
                        break;
                    case "texture":
                        if (v.contents) {
                            if (k === "map") {
                                await parser.assignTexture(
                                    parseTarget,
                                    k,
                                    v.contents,
                                    SRGBColorSpace,
                                );
                            } else {
                                await parser.assignTexture(parseTarget, k, v.contents);
                            }
                        } else {
                            parseTarget[k] = null;
                        }
                        break;
                    case "color":
                        if (v.contents !== null && !v.contents?.isColor) {
                            parseTarget[k] = new Color(v.contents);
                        } else {
                            parseTarget[k] = v.contents;
                        }
                        break;
                    default:
                        parseTarget[k] = v.contents;
                        break;
                }
            }),
        );
    }
}
