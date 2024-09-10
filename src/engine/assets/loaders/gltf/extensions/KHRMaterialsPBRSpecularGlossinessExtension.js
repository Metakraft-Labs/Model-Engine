import { CanvasTexture } from "three";

import createReadableTexture from "../../../../../spatial/renderer/functions/createReadableTexture";

import { ImporterExtension } from "./ImporterExtension";

export class KHRMaterialsPBRSpecularGlossinessExtension extends ImporterExtension {
    name = "KHR_materials_pbrSpecularGlossiness";

    extendMaterialParams(materialIndex, materialParams) {
        const parser = this.parser;
        const materialDef = parser.json.materials[materialIndex];
        if (!materialDef.extensions?.[this.name]) return Promise.resolve();
        const extension = materialDef.extensions[this.name];
        const assignDiffuse = async () => {
            if (!extension.diffuseTexture) return;
            return parser.assignTexture(materialParams, "map", extension.diffuseTexture);
        };
        const invertSpecular = async () => {
            if (!extension.specularGlossinessTexture) return;
            const dud = {
                texture: null,
            };
            await parser.assignTexture(dud, "texture", extension.specularGlossinessTexture);
            const mapData = await createReadableTexture(dud.texture, { canvas: true });
            const canvas = mapData.image;
            const ctx = canvas.getContext("2d");
            ctx.globalCompositeOperation = "difference";
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
            const invertedTexture = new CanvasTexture(canvas);
            materialParams.roughnessMap = invertedTexture;
            //materialParams.metalnessMap = dud.texture!
            //dud.texture and mapData are disposed by garbage collection after this function returns
        };
        return Promise.all([assignDiffuse(), invertSpecular()]).then(() => Promise.resolve());
    }
}
