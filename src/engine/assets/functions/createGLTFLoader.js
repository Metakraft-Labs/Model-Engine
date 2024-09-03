import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { Group, WebGLRenderer } from "three";

import { isClient } from "../../../common/src/utils/getEnvironment";

import { Engine } from "../../../ecs";
import { DRACOLoader } from "../loaders/gltf/DRACOLoader";
import { CachedImageLoadExtension } from "../loaders/gltf/extensions/CachedImageLoadExtension";
import EEECSImporterExtension from "../loaders/gltf/extensions/EEECSImporterExtension";
import { EEMaterialImporterExtension } from "../loaders/gltf/extensions/EEMaterialImporterExtension";
import { GPUInstancingExtension } from "../loaders/gltf/extensions/GPUInstancingExtension";
import { HubsComponentsExtension } from "../loaders/gltf/extensions/HubsComponentsExtension";
import { KHRMaterialsPBRSpecularGlossinessExtension } from "../loaders/gltf/extensions/KHRMaterialsPBRSpecularGlossinessExtension";
import { HubsLightMapExtension } from "../loaders/gltf/extensions/LightMapExtension";
import { ResourceManagerLoadExtension } from "../loaders/gltf/extensions/ResourceManagerLoadExtension";
import { GLTFLoader } from "../loaders/gltf/GLTFLoader";
import { KTX2Loader } from "../loaders/gltf/KTX2Loader";
import { MeshoptDecoder } from "../loaders/gltf/meshopt_decoder.module";
import { loadDRACODecoderNode, NodeDRACOLoader } from "../loaders/gltf/NodeDracoLoader";

export const initializeKTX2Loader = loader => {
    const ktxLoader = new KTX2Loader();
    ktxLoader.setTranscoderPath(Engine.instance.store.publicPath + "/loader_decoders/basis/");
    const renderer = new WebGLRenderer();
    ktxLoader.detectSupport(renderer);
    renderer.dispose();
    loader.setKTX2Loader(ktxLoader);
};

export const createGLTFLoader = (keepMaterials = false) => {
    const loader = new GLTFLoader();
    initializeKTX2Loader(loader);

    loader.register(parser => new GPUInstancingExtension(parser));
    loader.register(parser => new HubsLightMapExtension(parser));
    loader.registerFirst(parser => new EEMaterialImporterExtension(parser));
    loader.register(parser => new KHRMaterialsPBRSpecularGlossinessExtension(parser));
    loader.register(parser => new EEECSImporterExtension(parser));
    loader.register(parser => new HubsComponentsExtension(parser));
    loader.register(
        parser =>
            new VRMLoaderPlugin(parser, { helperRoot: new Group(), autoUpdateHumanBones: false }),
    );
    loader.register(parser => new CachedImageLoadExtension(parser));
    loader.register(parser => new ResourceManagerLoadExtension(parser));

    if (MeshoptDecoder.useWorkers) {
        MeshoptDecoder.useWorkers(2);
    }
    loader.setMeshoptDecoder(MeshoptDecoder);

    if (isClient) {
        initializeKTX2Loader(loader);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(Engine.instance.store.publicPath + "/loader_decoders/");
        dracoLoader.setWorkerLimit(1);
        loader.setDRACOLoader(dracoLoader);
    } else {
        loadDRACODecoderNode();
        const dracoLoader = new NodeDRACOLoader();
        /* @ts-ignore */
        dracoLoader.preload = () => {};
        /* @ts-ignore */
        loader.setDRACOLoader(dracoLoader);
    }

    return loader;
};
