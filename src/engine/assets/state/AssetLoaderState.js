import { defineState } from "../../../hyperflux";

import { createGLTFLoader } from "../../assets/functions/createGLTFLoader";

export const AssetLoaderState = defineState({
    name: "AssetLoaderState",
    initial: () => {
        const gltfLoader = createGLTFLoader();
        return {
            gltfLoader,
            cortoLoader: null,
        };
    },
});
