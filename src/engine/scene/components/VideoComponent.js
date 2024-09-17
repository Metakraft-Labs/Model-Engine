import { useEffect } from "react";
import {
    ClampToEdgeWrapping,
    DoubleSide,
    LinearFilter,
    ShaderMaterial,
    Vector2,
    VideoTexture,
} from "three";

import { UUIDComponent } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { createEntity, removeEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { defineState, NO_PROXY, useHookstate } from "../../../hyperflux";
import { isMobile } from "../../../spatial/common/functions/isMobile";
import { createPriorityQueue } from "../../../spatial/common/functions/PriorityQueue";
import { NameComponent } from "../../../spatial/common/NameComponent";
import {
    MeshComponent,
    useMeshComponent,
} from "../../../spatial/renderer/components/MeshComponent";
import {
    setVisibleComponent,
    VisibleComponent,
} from "../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { isMobileXRHeadset } from "../../../spatial/xr/XRState";
import { ObjectFitFunctions } from "../../../spatial/xrui/functions/ObjectFitFunctions";

import { clearErrors } from "../functions/ErrorFunctions";
import { PLANE_GEO, resizeVideoMesh, SPHERE_GEO } from "./ImageComponent";
import { MediaElementComponent } from "./MediaComponent";

export const VideoTexturePriorityQueueState = defineState({
    name: "VideoTexturePriorityQueueState",
    initial: () => {
        const accumulationBudget = isMobileXRHeadset || isMobile ? 1 : 3;
        return {
            queue: createPriorityQueue({
                accumulationBudget,
            }),
        };
    },
});

class VideoTexturePriorityQueue extends VideoTexture {
    constructor(video) {
        super(video);
        this.minFilter = LinearFilter;
        this.magFilter = LinearFilter;
        this.generateMipmaps = false;
    }
    update() {}
}

export const VideoComponent = defineComponent({
    name: "EE_video",
    jsonID: "EE_video",

    onInit: _entity => {
        return {
            side: DoubleSide,
            size: new Vector2(1, 1),
            uvOffset: new Vector2(0, 0),
            uvScale: new Vector2(1, 1),
            alphaUVOffset: new Vector2(0, 0),
            alphaUVScale: new Vector2(1, 1),
            wrapS: ClampToEdgeWrapping,
            wrapT: ClampToEdgeWrapping,
            useAlpha: false,
            useAlphaUVTransform: false,
            alphaThreshold: 0.5,
            fit: "contain",
            projection: "Flat",
            mediaUUID: "",
            // internal
            videoMeshEntity: UndefinedEntity,
            texture,
            userData: { ignoreOnExport: true },
        };
    },

    toJSON: (entity, component) => {
        return {
            /**
             * An entity with with an attached MediaComponent;if an empty string, then the current entity is assumed
             */
            mediaUUID: component.mediaUUID.value,
            side: component.side.value,
            size: component.size.value,
            uvOffset: component.uvOffset.value,
            uvScale: component.uvScale.value,
            alphaUVOffset: component.alphaUVOffset.value,
            alphaUVScale: component.alphaUVScale.value,
            wrapS: component.wrapS.value,
            wrapT: component.wrapT.value,
            useAlpha: component.useAlpha.value,
            useAlphaUVTransform: component.useAlphaUVTransform.value,
            alphaThreshold: component.alphaThreshold.value,
            fit: component.fit.value,
            projection: component.projection.value,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (typeof json.mediaUUID === "string") component.mediaUUID.set(json.mediaUUID);
        if (typeof json.side === "number") component.side.set(json.side);
        if (typeof json.size === "object")
            component.size.set(new Vector2(json.size.x, json.size.y));
        if (typeof json.uvOffset === "object")
            component.uvOffset.set(new Vector2(json.uvOffset.x, json.uvOffset.y));
        if (typeof json.uvScale === "object")
            component.uvScale.set(new Vector2(json.uvScale.x, json.uvScale.y));
        if (typeof json.alphaUVOffset === "object")
            component.alphaUVOffset.set(new Vector2(json.alphaUVOffset.x, json.alphaUVOffset.y));
        if (typeof json.alphaUVScale === "object")
            component.alphaUVScale.set(new Vector2(json.alphaUVScale.x, json.alphaUVScale.y));
        if (typeof json.wrapS === "number") component.wrapS.set(json.wrapS);
        if (typeof json.wrapT === "number") component.wrapT.set(json.wrapT);
        if (typeof json.useAlpha === "boolean") component.useAlpha.set(json.useAlpha);
        if (typeof json.useAlphaUVTransform === "boolean")
            component.useAlphaUVTransform.set(json.useAlphaUVTransform);
        if (typeof json.alphaThreshold === "number")
            component.alphaThreshold.set(json.alphaThreshold);
        if (typeof json.fit === "string") component.fit.set(json.fit);
        if (
            typeof json.projection === "string" &&
            (json.projection === "Flat" || json.projection === "Equirectangular360")
        )
            component.projection.set(json.projection);
    },

    onRemove: (entity, component) => {
        if (VideoComponent.uniqueVideoEntities.includes(entity)) {
            VideoComponent.uniqueVideoEntities.splice(
                VideoComponent.uniqueVideoEntities.indexOf(entity),
                1,
            );
        }
    },

    errors: ["INVALID_MEDIA_UUID", "MISSING_MEDIA_ELEMENT"],

    uniqueVideoEntities: [],

    reactor: VideoReactor,
});

function VideoReactor() {
    const entity = useEntityContext();
    const video = useComponent(entity, VideoComponent);
    const visible = useOptionalComponent(entity, VisibleComponent);
    const mediaUUID = video.mediaUUID.value;
    const mediaEntity = UUIDComponent.getEntityByUUID(mediaUUID) || entity;
    const mediaElement = useOptionalComponent(mediaEntity, MediaElementComponent);

    const videoMeshEntity = useHookstate(createEntity);
    const mesh = useMeshComponent(
        videoMeshEntity.value,
        PLANE_GEO,
        () =>
            new ShaderMaterial({
                uniforms: {
                    map: { value },
                    alphaMap: { value },
                    uvOffset: { value: new Vector2(0, 0) },
                    uvScale: { value: new Vector2(1, 1) },
                    useAlpha: { value: false },
                    alphaThreshold: { value: 0.5 },
                    useAlphaUVTransform: { value: false },
                    alphaUVOffset: { value: new Vector2(0, 0) },
                    alphaUVScale: { value: new Vector2(1, 1) },
                    wrapS: { value: ClampToEdgeWrapping },
                    wrapT: { value: ClampToEdgeWrapping },
                },
                vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }

      `,
                fragmentShader: `
      #ifdef USE_MAP
        uniform sampler2D map;
      #endif
        uniform bool useAlpha;
        uniform float alphaThreshold;
        uniform vec2 uvOffset;
        uniform vec2 uvScale;
        uniform bool useAlphaUVTransform;
        uniform vec2 alphaUVOffset;
        uniform vec2 alphaUVScale;
        uniform int wrapS;
        uniform int wrapT;

        varying vec2 vUv;

        vec2 applyWrapping(vec2 uv, int wrapS, int wrapT) {
          vec2 wrappedUv = uv;
          // Repeat Wrapping
          if (wrapS == 1000) {
            wrappedUv.x = fract(wrappedUv.x);
          } else if (wrapS == 1002) {
            float mirrored = mod(wrappedUv.x, 2.0);
            if (mirrored > 1.0) mirrored = 2.0 - mirrored;
            wrappedUv.x = mirrored;
          } else {
            wrappedUv.x = clamp(wrappedUv.x, 0.0, 1.0);
          }
          
          if (wrapT == 1000) {
            wrappedUv.y = fract(wrappedUv.y);
          } else if (wrapT == 1002) {
            float mirrored = mod(wrappedUv.y, 2.0);
            if (mirrored > 1.0) mirrored = 2.0 - mirrored;
            wrappedUv.y = mirrored;
          } else {
            wrappedUv.y = clamp(wrappedUv.y, 0.0, 1.0);
          }
          return wrappedUv;
        }



        void main() {
        #ifdef USE_MAP
          vec2 mapUv = applyWrapping(vUv * uvScale + uvOffset, wrapS, wrapT);
          vec4 color = texture2D(map, mapUv);
          color.rgb = pow(color.rgb, vec3(2.2));
          if (useAlpha) {
            if (useAlphaUVTransform) {
                vec2 alphaMapUv = applyWrapping(vUv * alphaUVScale + alphaUVOffset, wrapS, wrapT);
                vec4 alphaColor = texture2D(map, alphaMapUv);
                float intensity = alphaColor.r * 0.3 + alphaColor.g * 0.59 + alphaColor.b * 0.11;
                if (intensity < alphaThreshold) discard;
            } else {
                float intensity = color.r * 0.3 + color.g * 0.59 + color.b * 0.11;
                if (intensity < alphaThreshold) discard;
            }
          }
          gl_FragColor = color;
        #else
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        #endif
        }
      `,
            }),
    );

    useEffect(() => {
        const videoEntity = videoMeshEntity.value;
        video.videoMeshEntity.set(videoEntity);
        mesh.name.set(`video-group-${entity}`);
        setComponent(videoEntity, EntityTreeComponent, { parentEntity: entity });
        setComponent(videoEntity, NameComponent, mesh.name.value);
        return () => {
            removeEntity(videoEntity);
        };
    }, []);

    useEffect(() => {
        setVisibleComponent(videoMeshEntity.value, !!visible);
    }, [visible]);

    // update side
    useEffect(() => {
        mesh.material.side.set(video.side.value);
    }, [video.side]);

    // update mesh
    useEffect(() => {
        const videoMesh = mesh.value;
        resizeVideoMesh(videoMesh);
        const scale = ObjectFitFunctions.computeContentFitScale(
            videoMesh.scale.x,
            videoMesh.scale.y,
            video.size.width.value,
            video.size.height.value,
            video.fit.value,
        );
        videoMesh.scale.setScalar(scale);
    }, [video.size, video.fit, video.texture]);

    useEffect(() => {
        mesh.geometry.set(video.projection.value === "Flat" ? PLANE_GEO() : SPHERE_GEO());
        mesh.geometry.attributes.position.needsUpdate.set(true);
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.map.value = video.texture.value;
        const defines = mesh.material.defines.get(NO_PROXY);
        if (video.texture.value) {
            defines.USE_MAP = "";
        } else {
            delete defines.USE_MAP;
        }
        mesh.material.needsUpdate.set(true);
    }, [video.texture, video.projection]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.wrapS.value = video.wrapS.value;
    }, [video.wrapS]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.wrapT.value = video.wrapT.value;
    }, [video.wrapT]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.useAlpha.value = video.useAlpha.value;
    }, [video.useAlpha]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.alphaThreshold.value = video.alphaThreshold.value;
    }, [video.alphaThreshold]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.uvOffset.value = video.uvOffset.value;
    }, [video.uvOffset]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.uvScale.value = video.uvScale.value;
    }, [video.uvScale]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.useAlphaUVTransform.value = video.useAlphaUVTransform.value;
    }, [video.useAlphaUVTransform]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.alphaUVOffset.value = video.alphaUVOffset.value;
    }, [video.alphaUVOffset]);

    useEffect(() => {
        const uniforms = mesh.material.uniforms.get(NO_PROXY);
        uniforms.alphaUVScale.value = video.alphaUVScale.value;
    }, [video.alphaUVScale]);

    useEffect(() => {
        if (!mediaEntity || !mediaElement) return;
        const sourceVideoComponent = getComponent(mediaEntity, VideoComponent);
        const sourceMeshComponent = getOptionalComponent(mediaEntity, MeshComponent);
        const sourceTexture = sourceVideoComponent.texture;
        if (video.texture.value) {
            video.texture.value.image = mediaElement.element.value;
            clearErrors(entity, VideoComponent);
        } else {
            if (sourceTexture && sourceMeshComponent) {
                mesh.material.set(sourceMeshComponent.material);
                clearErrors(entity, VideoComponent);
            } else {
                video.texture.set(new VideoTexturePriorityQueue(mediaElement.element.value));
                VideoComponent.uniqueVideoEntities.push(mediaEntity);
                clearErrors(entity, VideoComponent);
                return () => {
                    if (VideoComponent.uniqueVideoEntities.includes(entity)) {
                        VideoComponent.uniqueVideoEntities.splice(
                            VideoComponent.uniqueVideoEntities.indexOf(entity),
                            1,
                        );
                    }
                };
            }
        }
    }, [video.texture, mediaEntity, mediaElement]);
    return null;
}
