import { ResourceManager } from "../../../spatial/resources/ResourceState";

import { GLTFLoaderPlugin } from "../GLTFLoader";
import { ImporterExtension } from "./ImporterExtension";

class ResourceManagerLoadExtension extends ImporterExtension implements GLTFLoaderPlugin {
    name = "EE_resourceManagerLoadExtension";

    beforeRoot() {
        return null;
    }

    afterRoot(result: GLTF) {
        this.AddAssetToResourceManager(result.scene);
        return null;
    }

    AddAssetToResourceManager(asset) {
        const parser = this.parser;
        const assetKey = parser.options.url;
        ResourceManager.addReferencedAsset(assetKey, asset);
        if (asset.children)
            for (const child of asset.children) this.AddAssetToResourceManager(child);
    }
}

export { ResourceManagerLoadExtension };
