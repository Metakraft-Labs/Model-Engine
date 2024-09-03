// array containing audio file type
export const AudioFileTypes = [".mp3", ".mpeg", "audio/mpeg", ".ogg"];
//array containing video file type
export const VideoFileTypes = [".mp4", "video/mp4", ".m3u8", "application/vnd.apple.mpegurl"];
//array containing image files types
export const ImageFileTypes = [
    ".png",
    ".jpeg",
    ".jpg",
    ".gif",
    ".ktx2",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/ktx2",
];
//array containing model file type.
export const ModelFileTypes = [
    ".glb",
    ".gltf",
    "model/gltf-binary",
    "model/gltf+json",
    ".fbx",
    ".usdz",
    ".vrm",
];
//array containing volumetric file type.
export const VolumetricFileTypes = [".manifest"];
//array containing custom script type.
export const CustomScriptFileTypes = [".tsx", ".ts", ".js", ".jsx"];
export const BinaryFileTypes = [".bin"];
//array contains arrays of all files types.
export const AllFileTypes = [
    ...AudioFileTypes,
    ...VideoFileTypes,
    ...ImageFileTypes,
    ...ModelFileTypes,
    ...VolumetricFileTypes,
    ...CustomScriptFileTypes,
    ...BinaryFileTypes,
];

//creating comma separated string contains all file types
export const AcceptsAllFileTypes = AllFileTypes.join(",");

export const MimeTypeToAssetType = {
    "audio/mpeg": "mp3",
    "video/mp4": "mp4",
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/ktx2": "ktx2",
    "model/gltf-binary": "glb",
    "model/gltf+json": "gltf",
    "model/vrm": "vrm",
    "model/vrml": "vrm",
};

export const AssetTypeToMimeType = {
    ["mp3"]: "audio/mpeg",
    ["mp4"]: "video/mp4",
    ["png"]: "image/png",
    ["jpeg"]: "image/jpeg",
    ["ktx2"]: "image/ktx2",
    ["glb"]: "model/gltf-binary",
    ["gltf"]: "model/gltf+json",
};

export const ExtensionToAssetType = {
    gltf: "gltf",
    glb: "glb",
    usdz: "usdz",
    fbx: "fbx",
    vrm: "vrm",
    tga: "tga",
    ktx2: "ktx2",
    ddx: "dds",
    png: "png",
    jpg: "jpg",
    jpeg: "jpeg",
    mp3: "mp3",
    aac: "aac",
    ogg: "ogg",
    m4a: "m4a",
    mp4: "mp4",
    mkv: "mkv",
    m3u8: "m3u8",
    material: "mat",
};
