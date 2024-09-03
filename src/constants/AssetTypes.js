import { NativeTypes } from "react-dnd-html5-backend";

export const ItemTypes = {
    File: NativeTypes.FILE,
    Folder: "folder",
    Audios: ["mp3", "mpeg", "audio/mpeg"],
    Images: ["png", "jpeg", "jpg", "gif", "ktx2", "image/png", "image/jpeg", "image/ktx2"],
    Models: [
        "glb",
        "model/glb",
        "gltf",
        "model/gltf",
        "fbx",
        "model/fbx",
        "usdz",
        "model/usdz",
        "vrm",
        "model/vrm",
    ],
    Scripts: ["tsx", "ts", "jsx", "js", "script"],
    Videos: ["mp4", "m3u8", "video/mp4", "mkv"],
    Volumetrics: ["manifest"],
    Text: ["text", "txt"],
    ECS: ["scene.json"],
    Node: "Node",
    Material: "Material",
    Lookdev: "Lookdev",
    Prefab: "Prefab",
    Component: "Component",
};

export const SupportedFileTypes = [
    ...ItemTypes.Images,
    ...ItemTypes.Audios,
    ...ItemTypes.Videos,
    ...ItemTypes.Volumetrics,
    ...ItemTypes.Models,
    ...ItemTypes.Scripts,
    ItemTypes.Folder,
    ItemTypes.File,
];
