import { UASTCFlags } from "../../../xrui/core/textures/KTX2Encoder";

export const KTX2EncodeDefaultArguments = {
    src: "",
    flipY: false,
    format: "ktx2",
    srgb: true,
    mode: "ETC1S",
    quality: 128,
    mipmaps: true,
    resize: false,
    resizeWidth: 0,
    resizeHeight: 0,
    resizeMethod: "stretch",
    compressionLevel: 2,
    uastcFlags: UASTCFlags.UASTCLevelFastest,
    normalMap: false,
    uastcZstandard: false,
};
