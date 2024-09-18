import matches from "ts-matches";

import { getComponent, hasComponent, UUIDComponent } from "../../../../../ecs";
import { NameComponent } from "../../../../../spatial/common/NameComponent";
import {
    MaterialPlugins,
    MaterialPrototypeComponent,
    MaterialStateComponent,
} from "../../../../../spatial/renderer/materials/MaterialComponent";

import { injectMaterialDefaults } from "../../../../../spatial/renderer/materials/materialFunctions";
import { ExporterExtension } from "./ExporterExtension";

export function isOldEEMaterial(extension) {
    const argValues = Object.values(extension.args);
    return !matches
        .arrayOf(
            matches.shape({
                type: matches.string,
            }),
        )
        .test(argValues);
}

export default class EEMaterialExporterExtension extends ExporterExtension {
    constructor(writer) {
        super(writer);
        this.name = "EE_material";
        this.matCache = new Map();
    }

    matCache;

    writeMaterial(material, materialDef) {
        const materialEntityUUID = material.uuid;
        const materialEntity = UUIDComponent.getEntityByUUID(materialEntityUUID);
        const argData = injectMaterialDefaults(materialEntityUUID);
        if (!argData) return;
        const result = {};
        Object.entries(argData).map(([k, v]) => {
            const argEntry = {
                type: v.type,
                contents: material[k],
            };
            if (v.type === "texture" && material[k]) {
                if (k === "envMap") return; //for skipping environment maps which cause errors
                if (material[k].isCubeTexture) return; //for skipping environment maps which cause errors
                const texture = material[k];
                if (texture.source.data && this.matCache.has(texture.source.data)) {
                    argEntry.contents = this.matCache.get(texture.source.data);
                } else {
                    const mapDef = {
                        index: this.writer.processTexture(texture),
                    };
                    this.matCache.set(texture.source.data, { ...mapDef });
                    argEntry.contents = mapDef;
                }
                argEntry.contents.texCoord = texture.channel;
                this.writer.options.flipY && (texture.repeat.y *= -1);
                this.writer.applyTextureTransform(argEntry.contents, texture);
            }
            result[k] = argEntry;
        });
        delete materialDef.pbrMetallicRoughness;
        delete materialDef.normalTexture;
        delete materialDef.emissiveTexture;
        delete materialDef.emissiveFactor;
        const materialComponent = getComponent(materialEntity, MaterialStateComponent);
        const prototype = getComponent(
            materialComponent.prototypeEntity,
            MaterialPrototypeComponent,
        );
        const plugins = Object.keys(MaterialPlugins)
            .map(plugin => {
                if (!hasComponent(materialEntity, MaterialPlugins[plugin])) return;
                const pluginComponent = getComponent(materialEntity, MaterialPlugins[plugin]);
                const uniforms = {};
                for (const key in pluginComponent) {
                    uniforms[key] = pluginComponent[key].value;
                }
                return { id: plugin, uniforms };
            })
            .filter(Boolean);
        materialDef.extensions = materialDef.extensions ?? {};
        materialDef.extensions[this.name] = {
            uuid: getComponent(materialEntity, UUIDComponent),
            name: getComponent(materialEntity, NameComponent),
            prototype: Object.keys(prototype.prototypeConstructor)[0],
            plugins: plugins,
            args: result,
        };
        materialDef.name = getComponent(materialEntity, NameComponent);
        this.writer.extensionsUsed[this.name] = true;
    }
}
