import { useEffect } from "react";
import {
    DoubleSide,
    LinearMipmapLinearFilter,
    MeshBasicMaterial,
    PlaneGeometry,
    SphereGeometry,
    SRGBColorSpace,
    Vector2,
} from "three";

import { defineComponent, getComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useMeshComponent } from "../../../spatial/renderer/components/MeshComponent";

import { TransformComponent } from "../../../spatial";
import { AssetLoader } from "../../assets/classes/AssetLoader";
import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import { ImageAlphaMode, ImageProjection } from "../classes/ImageUtils";
import { addError, clearErrors } from "../functions/ErrorFunctions";

// Making these functions to make it more explicit, otherwise .clone() needs to be called any time these are referenced between components
export const PLANE_GEO = () => new PlaneGeometry(1, 1, 1, 1);
export const SPHERE_GEO = () => new SphereGeometry(1, 64, 32);
export const PLANE_GEO_FLIPPED = () => flipNormals(new PlaneGeometry(1, 1, 1, 1));
export const SPHERE_GEO_FLIPPED = () => flipNormals(new SphereGeometry(1, 64, 32));

export const ImageComponent = defineComponent({
    name: "EE_image",
    jsonID: "EE_image",

    onInit: entity => {
        return {
            source: `${process.env.REACT_APP_S3_ASSETS}/editor/projects/spark/default-project/assets/sample_etc1s.ktx2`,
            alphaMode: ImageAlphaMode.Opaque,
            alphaCutoff: 0.5,
            projection: ImageProjection.Flat,
            side: DoubleSide,
        };
    },

    toJSON: (entity, component) => {
        return {
            source: component.source.value,
            alphaMode: component.alphaMode.value,
            alphaCutoff: component.alphaCutoff.value,
            projection: component.projection.value,
            side: component.side.value,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        // backwards compatability
        if (typeof json.source === "string" && json.source !== component.source.value)
            component.source.set(json.source);
        if (typeof json.alphaMode === "string" && json.alphaMode !== component.alphaMode.value)
            component.alphaMode.set(json.alphaMode);
        if (
            typeof json.alphaCutoff === "number" &&
            json.alphaCutoff !== component.alphaCutoff.value
        )
            component.alphaCutoff.set(json.alphaCutoff);
        if (typeof json.projection === "string" && json.projection !== component.projection.value)
            component.projection.set(json.projection);
        if (typeof json.side === "number" && json.side !== component.side.value)
            component.side.set(json.side);
    },

    errors: ["MISSING_TEXTURE_SOURCE", "UNSUPPORTED_ASSET_CLASS", "LOADING_ERROR", "INVALID_URL"],

    reactor: ImageReactor,
});

const _size = new Vector2();
export function getTextureSize(texture, size = _size) {
    const image = texture?.image;
    const width = image?.videoWidth || image?.naturalWidth || image?.width || 0;
    const height = image?.videoHeight || image?.naturalHeight || image?.height || 0;
    return size.set(width, height);
}

export function resizeVideoMesh(mesh) {
    if (!mesh.material.uniforms.map?.value) return;

    const { width, height } = getTextureSize(mesh.material.uniforms.map.value);

    if (!width || !height) return;

    const transform = getComponent(mesh.entity, TransformComponent);

    const ratio = (height || 1) / (width || 1);
    const _width = Math.min(1.0, 1.0 / ratio);
    const _height = Math.min(1.0, ratio);
    mesh.scale.set(_width, _height, 1);
}

export function resizeImageMesh(mesh) {
    if (!mesh.material.map) return;

    const { width, height } = getTextureSize(mesh.material.map);

    if (!width || !height) return;

    const transform = getComponent(mesh.entity, TransformComponent);
    const ratio = (height || 1) / (width || 1);
    const _width = Math.min(1.0, 1.0 / ratio) * transform.scale.x;
    const _height = Math.min(1.0, ratio) * transform.scale.y;
    mesh.scale.set(_width, _height, 1);
}

function flipNormals(geometry) {
    const uvs = geometry.attributes.uv.array;
    for (let i = 1; i < uvs.length; i += 2) {
        // @ts-ignore
        uvs[i] = 1 - uvs[i];
    }
    return geometry;
}

export function ImageReactor() {
    const entity = useEntityContext();
    const image = useComponent(entity, ImageComponent);
    const [texture, error] = useTexture(image.source.value, entity);
    const mesh = useMeshComponent(entity, PLANE_GEO, () => new MeshBasicMaterial());

    useEffect(() => {
        if (!error) return;
        addError(entity, ImageComponent, `LOADING_ERROR`, error.message);
    }, [error]);

    useEffect(() => {
        if (!image.source.value) {
            addError(entity, ImageComponent, `MISSING_TEXTURE_SOURCE`);
            return;
        }

        const assetType = AssetLoader.getAssetClass(image.source.value);
        if (assetType !== "image") {
            addError(entity, ImageComponent, `UNSUPPORTED_ASSET_CLASS`);
        }
    }, [image.source]);

    useEffect(
        function updateTexture() {
            if (!texture) return;

            clearErrors(entity, ImageComponent);

            texture.colorSpace = SRGBColorSpace;
            texture.minFilter = LinearMipmapLinearFilter;

            mesh.material.map.set(texture);
            mesh.visible.set(true);
        },
        [texture],
    );

    useEffect(
        function updateGeometry() {
            if (!mesh.material.map.value) return;

            const flippedTexture = mesh.material.map.value.flipY;
            switch (image.projection.value) {
                case ImageProjection.Equirectangular360:
                    mesh.geometry.set(flippedTexture ? SPHERE_GEO() : SPHERE_GEO_FLIPPED());
                    mesh.scale.value.set(-1, 1, 1);
                    break;
                case ImageProjection.Flat:
                default:
                    mesh.geometry.set(flippedTexture ? PLANE_GEO() : PLANE_GEO_FLIPPED());
                    resizeImageMesh(mesh.value);
            }
        },
        [mesh.material.map, image.projection],
    );

    useEffect(
        function updateMaterial() {
            mesh.material.transparent.set(image.alphaMode.value !== ImageAlphaMode.Opaque);
            mesh.material.alphaTest.set(
                image.alphaMode.value === "Mask" ? image.alphaCutoff.value : 0,
            );
            mesh.material.side.set(image.side.value);
        },
        [image.alphaMode, image.alphaCutoff, image.side],
    );

    return null;
}
