import { useEffect, useMemo, useRef } from "react";
import {
    BufferGeometry,
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    ShaderMaterial,
    Sphere,
    SRGBColorSpace,
    Texture,
    Vector3,
} from "three";

import { useVideoFrameCallback } from "../../../common/src/utils/useVideoFrameCallback";
import { Engine } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getMutableComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useExecute } from "../../../ecs/SystemFunctions";
import { AnimationSystemGroup } from "../../../ecs/SystemGroups";
import { getMutableState, getState } from "../../../hyperflux";
import { iOS } from "../../../spatial/common/functions/isMobile";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";

import { CORTOLoader } from "../../assets/loaders/corto/CORTOLoader";
import { AssetLoaderState } from "../../assets/state/AssetLoaderState";
import { AudioState } from "../../audio/AudioState";
import { MediaElementComponent } from "./MediaComponent";
import { ShadowComponent } from "./ShadowComponent";
import { UVOLDissolveComponent } from "./UVOLDissolveComponent";
import { handleAutoplay, VolumetricComponent } from "./VolumetricComponent";

const decodeCorto = (url, start, end) => {
    return (
        (new Promise() < BufferGeometry) |
        (null >
            ((res, rej) => {
                getState(AssetLoaderState).cortoLoader.load(url, start, end, geometry => {
                    res(geometry);
                });
            }))
    );
};

export const UVOL1Component = defineComponent({
    name: "UVOL1Component",

    onInit: _entity => {
        return {
            manifestPath: "",
            data: {},
            firstGeometryFrameLoaded: false,
            loadingEffectStarted: false,
            loadingEffectEnded: false,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (json.manifestPath) {
            component.manifestPath.set(json.manifestPath);
        }
        if (json.data) {
            component.data.set(json.data);
        }
    },

    reactor: UVOL1Reactor,
});

function UVOL1Reactor() {
    const entity = useEntityContext();
    const volumetric = useComponent(entity, VolumetricComponent);
    const component = useComponent(entity, UVOL1Component);
    const shadow = useOptionalComponent(entity, ShadowComponent);
    const videoElement = getMutableComponent(entity, MediaElementComponent).value;
    const audioContext = getState(AudioState).audioContext;
    const video = videoElement.element;

    const meshBuffer = useMemo(() => new Map(), []);
    const targetFramesToRequest = iOS ? 10 : 90;

    const videoTexture = useMemo(() => {
        const element = videoElement.element;
        const texture = new Texture(element);
        texture.generateMipmaps = false;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.isVideoTexture = true;
        texture.update = () => {};
        texture.colorSpace = SRGBColorSpace;
        return texture;
    }, []);

    const material = useMemo(() => {
        const _material = new MeshBasicMaterial({ color: 0xffffff });
        _material.map = videoTexture;
        return _material;
    }, []);

    const defaultGeometry = useMemo(() => new PlaneGeometry(0.001, 0.001), []);

    // @ts-ignore
    const mesh = useMemo(() => new Mesh(defaultGeometry, material), []);

    const pendingRequests = useRef(0);
    const nextFrameToRequest = useRef(0);

    useEffect(() => {
        if (!getState(AssetLoaderState).cortoLoader) {
            const loader = new CORTOLoader();
            loader.setDecoderPath(Engine.instance.store.publicPath + "/loader_decoders/");
            loader.preload();
            const assetLoaderState = getMutableState(AssetLoaderState);
            assetLoaderState.cortoLoader.set(loader);
        }
        if (volumetric.useLoadingEffect.value) {
            setComponent(entity, UVOLDissolveComponent);
        }

        video.src = component.manifestPath.value.replace(".manifest", ".mp4");
        video.load();
        video.addEventListener("ended", function setEnded() {
            volumetric.ended.set(true);
            video.removeEventListener("ended", setEnded);
        });
        volumetric.currentTrackInfo.duration.set(
            component.data.frameData.length / component.data.frameRate.value,
        );

        return () => {
            removeObjectFromGroup(entity, mesh);
            videoTexture.dispose();
            const numberOfFrames = component.data.value.frameData.length;
            removePlayedBuffer(numberOfFrames);
            meshBuffer.clear();
            video.src = "";
        };
    }, []);

    useEffect(() => {
        if (shadow) {
            shadow.cast.set(true);
            shadow.receive.set(true);
        }
    }, [shadow]);

    useEffect(() => {
        if (component.loadingEffectStarted.value && !component.loadingEffectEnded.value) {
            // Loading effect in progress. Let it finish
            return;
        }
        // If autoplay is enabled, play the video irrespective of paused state
        if (volumetric.autoplay.value && volumetric.initialBuffersLoaded.value) {
            handleAutoplay(audioContext, video, volumetric);
        }
    }, [volumetric.autoplay, volumetric.initialBuffersLoaded, component.loadingEffectEnded]);

    useEffect(() => {
        if (volumetric.paused.value || !volumetric.initialBuffersLoaded.value) {
            video.pause();
            return;
        }
        if (mesh.material !== material) {
            mesh.material = material;
            mesh.material.needsUpdate = true;
        }
        handleAutoplay(audioContext, video, volumetric);
    }, [volumetric.paused]);

    useEffect(() => {
        if (!component.firstGeometryFrameLoaded.value) return;
        let timer = -1;

        const prepareMesh = () => {
            if (video.buffered.length === 0) {
                // Video is not loaded yet,
                // wait for a bit and try again
                clearTimeout(timer);
                timer = window.setTimeout(prepareMesh, 200);
                return;
            }

            mesh.geometry = meshBuffer.get(0);
            mesh.geometry.attributes.position.needsUpdate = true;

            videoTexture.needsUpdate = true;
            const renderer = getComponent(Engine.instance.viewerEntity, RendererComponent);
            renderer.renderer.initTexture(videoTexture);

            if (volumetric.useLoadingEffect.value) {
                mesh.material = UVOLDissolveComponent.createDissolveMaterial(mesh);
                mesh.material.needsUpdate = true;
                component.loadingEffectStarted.set(true);
            }

            addObjectToGroup(entity, mesh);
        };

        prepareMesh();
    }, [component.firstGeometryFrameLoaded]);

    useVideoFrameCallback(video, (now, metadata) => {
        if (!metadata) return;
        /**
         * sync mesh frame to video texture frame
         */
        const processFrame = frameToPlay => {
            if (
                mesh.material instanceof ShaderMaterial &&
                !hasComponent(entity, UVOLDissolveComponent)
            ) {
                const oldMaterial = mesh.material;
                mesh.material = material;
                mesh.material.needsUpdate = true;
                oldMaterial.dispose();
            }
            volumetric.currentTrackInfo.currentTime.set(
                frameToPlay / component.data.frameRate.value,
            );

            if (meshBuffer.has(frameToPlay)) {
                // @ts-ignore: value cannot be anything else other than BufferGeometry
                mesh.geometry = meshBuffer.get(frameToPlay);
                mesh.geometry.attributes.position.needsUpdate = true;

                videoTexture.needsUpdate = true;
                getComponent(Engine.instance.viewerEntity, RendererComponent).renderer?.initTexture(
                    videoTexture,
                );
            }
            removePlayedBuffer(frameToPlay);
        };

        const frameToPlay = Math.round(metadata.mediaTime * component.data.value.frameRate);
        processFrame(frameToPlay);
    });

    useEffect(() => {
        video.playbackRate = volumetric.currentTrackInfo.playbackRate.value;
    }, [volumetric.currentTrackInfo.playbackRate]);

    useExecute(
        () => {
            //do not execute if the cortoloader has not been initialized
            if (getState(AssetLoaderState).cortoLoader === null) return;

            const delta = getState(ECSState).deltaSeconds;

            if (
                component.loadingEffectStarted.value &&
                !component.loadingEffectEnded.value &&
                // @ts-ignore
                UVOLDissolveComponent.updateDissolveEffect(entity, mesh, delta)
            ) {
                removeComponent(entity, UVOLDissolveComponent);
                mesh.material = material;
                mesh.material.needsUpdate = true;
                component.loadingEffectEnded.set(true);
                return;
            }

            const numberOfFrames = component.data.value.frameData.length;
            if (nextFrameToRequest.current === numberOfFrames - 1) {
                // Fetched all frames
                return;
            }

            const minimumBufferLength = targetFramesToRequest * 2;
            const meshBufferHasEnoughToPlay =
                meshBuffer.size >= Math.max(targetFramesToRequest * 2, 90); // 2 seconds
            const meshBufferHasEnough = meshBuffer.size >= minimumBufferLength * 5;

            if (pendingRequests.current == 0 && !meshBufferHasEnough) {
                const newLastFrame = Math.min(
                    nextFrameToRequest.current + targetFramesToRequest - 1,
                    numberOfFrames - 1,
                );
                for (let i = nextFrameToRequest.current; i <= newLastFrame; i++) {
                    const meshFilePath = component.manifestPath.value.replace(".manifest", ".drcs");
                    const byteStart = component.data.value.frameData[i].startBytePosition;
                    const byteEnd = byteStart + component.data.value.frameData[i].meshLength;
                    pendingRequests.current += 1;
                    decodeCorto(meshFilePath, byteStart, byteEnd)
                        .then(geometry => {
                            if (!geometry) {
                                throw new Error(
                                    "VDEBUG Entity ${entity} Invalid geometry frame: " +
                                        i.toString(),
                                );
                            }

                            geometry.boundingSphere = new Sphere().set(new Vector3(), Infinity);
                            meshBuffer.set(i, geometry);
                            pendingRequests.current -= 1;

                            if (i === 0) {
                                component.firstGeometryFrameLoaded.set(true);
                            }
                        })
                        .catch(e => {
                            console.error("Error decoding corto frame: ", i, e);
                            pendingRequests.current -= 1;
                        });

                    nextFrameToRequest.current = newLastFrame;
                }

                if (meshBufferHasEnoughToPlay && !volumetric.initialBuffersLoaded.value) {
                    volumetric.initialBuffersLoaded.set(true);
                }
            }
        },
        {
            with: AnimationSystemGroup,
        },
    );

    const removePlayedBuffer = currentFrame => {
        for (const [key, buffer] of meshBuffer.entries()) {
            if (key < currentFrame) {
                buffer.dispose();
                meshBuffer.delete(key);
            }
        }
    };

    return null;
}
