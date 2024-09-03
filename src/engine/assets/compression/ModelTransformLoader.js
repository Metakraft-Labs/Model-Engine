import { NodeIO } from "@gltf-transform/core";
import {
    EXTMeshGPUInstancing,
    EXTMeshoptCompression,
    KHRDracoMeshCompression,
    KHRLightsPunctual,
    KHRMaterialsClearcoat,
    KHRMaterialsEmissiveStrength,
    KHRMaterialsPBRSpecularGlossiness,
    KHRMaterialsSpecular,
    KHRMaterialsTransmission,
    KHRMaterialsUnlit,
    KHRMeshQuantization,
    KHRTextureBasisu,
    KHRTextureTransform,
} from "@gltf-transform/extensions";
import fetch from "cross-fetch";
import draco3d from "draco3dgltf";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

import { FileLoader } from "../loaders/base/FileLoader";
import { EEMaterialExtension } from "./extensions/EE_MaterialTransformer";
import { EEResourceIDExtension } from "./extensions/EE_ResourceIDTransformer";
import { VRMExtension } from "./extensions/EE_VRMTransformer";
import { MOZLightmapExtension } from "./extensions/MOZ_LightmapTransformer";

const transformHistory = [];
export default async function ModelTransformLoader() {
    const io = new NodeIO(fetch, {}).setAllowHTTP(true);
    io.registerExtensions([
        KHRLightsPunctual,
        KHRMaterialsSpecular,
        KHRMaterialsClearcoat,
        KHRMaterialsPBRSpecularGlossiness,
        KHRMaterialsUnlit,
        KHRMaterialsEmissiveStrength,
        KHRMaterialsTransmission,
        KHRDracoMeshCompression,
        EXTMeshGPUInstancing,
        EXTMeshoptCompression,
        KHRMeshQuantization,
        KHRTextureBasisu,
        KHRTextureTransform,
        MOZLightmapExtension,
        EEResourceIDExtension,
        EEMaterialExtension,
        VRMExtension,
    ]);
    io.registerDependencies({
        "meshopt.decoder": MeshoptDecoder,
        "meshopt.encoder": MeshoptEncoder,
        "draco3d.decoder": await draco3d.createDecoderModule(),
        "draco3d.encoder": await draco3d.createEncoderModule(),
    });
    return {
        io,
        load: async (src, noHistory = false) => {
            const loader = new FileLoader();
            loader.setResponseType("arraybuffer");
            const data = await loader.loadAsync(src);
            if (!noHistory) transformHistory.push(src);
            return io.readBinary(new Uint8Array(data));
        },
        //load: io.read,
        get prev() {
            return transformHistory.length > 0 ? transformHistory[0] : undefined;
        },
    };
}
