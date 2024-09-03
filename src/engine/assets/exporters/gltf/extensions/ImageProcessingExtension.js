import { Texture } from "three";

import iterateObject3D from "../../../../../spatial/common/functions/iterateObject3D";
import createReadableTexture from "../../../../../spatial/renderer/functions/createReadableTexture";

import { ExporterExtension } from "./ExporterExtension";

export default class ImageProcessingExtension extends ExporterExtension {
    writer;
    originalImages;

    constructor(writer) {
        super(writer);
        this.writer = writer;
        this.originalImages = [];
    }

    beforeParse(input) {
        const writer = this.writer;
        const inputs = Array.isArray(input) ? input : [input];
        inputs.forEach(input =>
            iterateObject3D(input, child => {
                if (child?.isMesh) {
                    const materials = Array.isArray(child.material)
                        ? child.material
                        : [child.material];
                    materials.forEach(material => {
                        Object.entries(material)
                            .filter(
                                ([_, value]) =>
                                    value instanceof Texture && !value.isCompressedTexture,
                            )
                            .forEach(([k, texture]) => {
                                writer.pending.push(
                                    createReadableTexture(texture, { flipY: true }).then(
                                        nuTexture => {
                                            this.originalImages.push({
                                                material,
                                                field: k,
                                                texture,
                                            });
                                            material[k] = nuTexture;
                                        },
                                    ),
                                );
                            });
                    });
                }
            }),
        );
    }

    afterParse(input) {
        this.originalImages.forEach(({ material, field, texture }) => {
            URL.revokeObjectURL(material[field].image.src);
            material[field] = texture;
        });
        this.originalImages = [];
    }
}
