import React from "react";
import { FiHexagon } from "react-icons/fi";
import { useGLTF } from "../../../engine/assets/functions/resourceLoaderHooks";
import { defineState, getMutableState, useHookstate } from "../../../hyperflux";

export const PrefabIcons = {
    Geo: <FiHexagon size="1.25rem" />,
    default: <FiHexagon size="1.25rem" />,
};

export const PrefabShelfState = defineState({
    name: "ee.editor.PrefabShelfItem",
    initial: () => [
        {
            name: "3D Model",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/3d-model.prefab.gltf`,
            category: "Geo",
            detail: "Blank 3D model ready for your own assets",
        },
        {
            name: "Primitive Geometry",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/geo.prefab.gltf`,
            category: "Geo",
        },
        {
            name: "Ground Plane",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/ground-plane.prefab.gltf`,
            category: "Geo",
        },
        {
            name: "Point Light",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/point-light.prefab.gltf`,
            category: "Lighting",
        },
        {
            name: "Spot Light",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/spot-light.prefab.gltf`,
            category: "Lighting",
        },
        {
            name: "Directional Light",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/directional-light.prefab.gltf`,
            category: "Lighting",
        },
        {
            name: "Ambient Light",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/ambient-light.prefab.gltf`,
            category: "Lighting",
        },
        {
            name: "Hemisphere Light",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/hemisphere-light.prefab.gltf`,
            category: "Lighting",
        },
        {
            name: "Box Collider",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/box-collider.prefab.gltf`,
            category: "Collider",
            detail: "Simple box collider",
        },
        {
            name: "Sphere Collider",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/sphere-collider.prefab.gltf`,
            category: "Collider",
            detail: "Simple sphere collider",
        },
        {
            name: "Cylinder Collider",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/cylinder-collider.prefab.gltf`,
            category: "Collider",
            detail: "Simple cylinder collider",
        },
        {
            name: "Text",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/text.prefab.gltf`,
            category: "Text",
        },
        {
            name: "Title",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/title.prefab.gltf`,
            category: "Text",
        },
        {
            name: "Body",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/body.prefab.gltf`,
            category: "Text",
        },
        {
            name: "Image",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/image.prefab.gltf`,
            category: "Image",
        },
        {
            name: "Video",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/video.prefab.gltf`,
            category: "Video",
        },
        {
            name: "Skybox",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/skybox.prefab.gltf`,
            category: "Lookdev",
        },
        {
            name: "Postprocessing",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/postprocessing.prefab.gltf`,
            category: "Lookdev",
        },
        {
            name: "Fog",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/fog.prefab.gltf`,
            category: "Lookdev",
        },
        {
            name: "Camera",
            url: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/prefabs/camera.prefab.gltf`,
            category: "Camera",
        },
    ],
    reactor: () => {
        const shelfState = useHookstate(getMutableState(PrefabShelfState));
        return shelfState.value.map(shelfItem => (
            <ShelfItemReactor key={shelfItem.url} url={shelfItem.url} />
        ));
    },
});

const ShelfItemReactor = props => {
    useGLTF(props.url);
    return null;
};
