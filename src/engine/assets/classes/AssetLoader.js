import { AudioLoader } from "three";

import { getState } from "../../../hyperflux";
import { isAbsolutePath } from "../../../spatial/common/functions/isAbsolutePath";

import { AssetExt, FileToAssetExt, FileToAssetType } from "../../../common/src/constants/AssetType";
import { Engine } from "../../../ecs";
import loadVideoTexture from "../../scene/materials/functions/LoadVideoTexture";
import { FileLoader } from "../loaders/base/FileLoader";
import { DDSLoader } from "../loaders/dds/DDSLoader";
import { FBXLoader } from "../loaders/fbx/FBXLoader";
import { TextureLoader } from "../loaders/texture/TextureLoader";
import { TGALoader } from "../loaders/tga/TGALoader";
import { USDZLoader } from "../loaders/usdz/USDZLoader";
import { AssetLoaderState } from "../state/AssetLoaderState";

/**
 * Get asset type from the asset file extension.
 * @param assetFileName Name of the Asset file.
 * @returns Asset type of the file.
 */
const getAssetType = assetFileName => {
    return FileToAssetExt(assetFileName);
};

/**
 * Get asset class from the asset file extension.
 * @param assetFileName Name of the Asset file.
 * @returns Asset class of the f../../..
 */
const getAssetClass = assetFileName => {
    return FileToAssetType(assetFileName);
};

export const getLoader = assetType => {
    switch (assetType) {
        case AssetExt.KTX2:
            return getState(AssetLoaderState).gltfLoader.ktx2Loader;
        case AssetExt.DDS:
            return new DDSLoader();
        case AssetExt.GLTF:
        case AssetExt.GLB:
        case AssetExt.VRM:
            return getState(AssetLoaderState).gltfLoader;
        case AssetExt.USDZ:
            return new USDZLoader();
        case AssetExt.FBX:
            return new FBXLoader();
        case AssetExt.TGA:
            return new TGALoader();
        case AssetExt.PNG:
        case AssetExt.JPEG:
            return new TextureLoader();
        case AssetExt.AAC:
        case AssetExt.MP3:
        case AssetExt.OGG:
        case AssetExt.M4A:
            return new AudioLoader();
        case AssetExt.MP4:
        case AssetExt.MKV:
        case AssetExt.M3U8:
            return { load: loadVideoTexture };
        default:
            return new FileLoader();
    }
};

const getAbsolutePath = url => (isAbsolutePath(url) ? url : Engine.instance.store.publicPath + url);

const loadAsset = async (
    url,
    onLoad = () => {},
    onProgress = () => {},
    onError = () => {},
    signal,
    loader,
) => {
    if (!url) {
        onError(new Error("URL is empty"));
        return;
    }
    url = getAbsolutePath(url);

    if (!loader) {
        const assetExt = getAssetType(url);
        loader = getLoader(assetExt);
    }

    try {
        return loader.load(url, onLoad, onProgress, onError, signal);
    } catch (error) {
        onError(error);
    }
};

export const AssetLoader = {
    getAbsolutePath,
    getAssetType,
    getAssetClass,
    /** @deprecated Use resourceLoaderHooks instead */
    loadAsset,
};
