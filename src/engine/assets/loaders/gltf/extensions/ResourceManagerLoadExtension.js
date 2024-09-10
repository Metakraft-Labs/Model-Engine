import { ResourceManager } from "../../../../../spatial/resources/ResourceState";

import { ImporterExtension } from "./ImporterExtension";

class ResourceManagerLoadExtension extends ImporterExtension {
    name = "EE_resourceManagerLoadExtension";

    beforeRoot() {
        return null;
    }

    afterRoot(result) {
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
