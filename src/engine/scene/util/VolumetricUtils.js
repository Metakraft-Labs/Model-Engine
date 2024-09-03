import { ShaderLib, ShaderMaterial, UniformsLib, UniformsUtils, Vector2 } from "three";
import { Engine, getComponent } from "../../../ecs";
import { getState } from "../../../hyperflux";
import { isMobile } from "../../../spatial/common/functions/isMobile";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { isMobileXRHeadset } from "../../../spatial/xr/XRState";
import { AssetLoaderState } from "../../assets/state/AssetLoaderState";
import { FORMAT_TO_EXTENSION, GeometryType } from "../constants/NewUVOLTypes";
import getFirstMesh from "./meshUtils";

export const getBufferGeometrySize = geometry => {
    const attributes = geometry.attributes;
    let size = 0;
    for (const key in attributes) {
        const attribute = attributes[key];
        size += attribute.array.byteLength;
    }
    return size;
};

export const getGLTFGeometrySize = mesh => {
    let size = getBufferGeometrySize(mesh.geometry);

    if (mesh.geometry.morphAttributes) {
        for (const key in mesh.geometry.morphAttributes) {
            mesh.geometry.morphAttributes[key].map(attribute => {
                size += attribute.array.byteLength;
            });
        }
    }
    return size;
};

export const getKTX2TextureSize = texture => {
    let size = 0;
    if (texture.image) {
        texture.mipmaps.map(mipmap => {
            size += mipmap.data.byteLength;
        });
    }
    return size;
};

const cortoQueue = [];
let pendingRequests = 0;
const MAX_CORTO_REQUESTS_AT_A_TIME = 6;

const processCortoQueue = () => {
    if (pendingRequests >= MAX_CORTO_REQUESTS_AT_A_TIME || cortoQueue.length === 0) {
        return;
    }

    const front = cortoQueue.shift();
    if (front) {
        pendingRequests++;
        loadCorto(front.url, front.byteStart, front.byteEnd)
            .then(data => {
                front.resolve(data);
            })
            .catch(err => {
                front.reject(err);
            })
            .finally(() => {
                pendingRequests--;
                if (pendingRequests === 0 && cortoQueue.length > 0) {
                    processCortoQueue();
                }
            });
    }
};

export const rateLimitedCortoLoader = (url, byteStart, byteEnd) => {
    return new Promise((resolve, reject) => {
        cortoQueue.push({
            url,
            byteStart,
            byteEnd,
            resolve,
            reject,
        });
        processCortoQueue();
    });
};

export const loadCorto = (url, byteStart, byteEnd) => {
    if (!getState(AssetLoaderState).cortoLoader) {
        throw new Error("loadCorto:CORTOLoader is not available");
    }
    return new Promise((res, rej) => {
        getState(AssetLoaderState).cortoLoader.load(url, byteStart, byteEnd, geometry => {
            if (geometry === null) {
                rej(
                    `loadCorto:Failed to load Corto geometry frame from ${url} at bytes ${byteStart} to ${byteEnd}`,
                );
            } else {
                res({
                    geometry,
                    memoryOccupied: getBufferGeometrySize(geometry),
                });
            }
        });
    });
};

export const loadDraco = url => {
    const gltfLoader = getState(AssetLoaderState).gltfLoader;
    if (!gltfLoader) {
        throw new Error("loadDraco:GLTFLoader is not available");
    }
    const dracoLoader = gltfLoader.dracoLoader;
    if (!dracoLoader) {
        throw new Error("loadDraco:DracoLoader is not available");
    }

    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        dracoLoader.load(
            url,
            geometry => {
                resolve({
                    geometry,
                    fetchTime: performance.now() - startTime,
                    memoryOccupied: getBufferGeometrySize(geometry),
                });
            },
            undefined,
            error => {
                reject(`loadDraco:Error loading draco geometry from ${url}: ${error.message}`);
            },
        );
    });
};

export const loadGLTF = url => {
    const gltfLoader = getState(AssetLoaderState).gltfLoader;
    if (!gltfLoader) {
        throw new Error("loadDraco:GLTFLoader is not available");
    }

    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        gltfLoader.load(
            url,
            ({ scene }) => {
                const mesh = getFirstMesh(scene);
                resolve({
                    mesh: mesh,
                    fetchTime: performance.now() - startTime,
                    memoryOccupied: getGLTFGeometrySize(mesh),
                });
            },
            undefined,
            err => {
                console.error("Error loading geometry: ", url, err);
                reject(`loadGLTF:Error loading geometry from ${url}: ${err.message}`);
            },
        );
    });
};

export const loadKTX2 = (url, _repeat, _offset) => {
    const gltfLoader = getState(AssetLoaderState).gltfLoader;
    if (!gltfLoader) {
        throw new Error("loadKTX2:GLTFLoader is not available");
    }
    const ktx2Loader = gltfLoader.ktx2Loader;
    if (!ktx2Loader) {
        throw new Error("loadKTX2:KTX2Loader is not available");
    }

    const repeat = _repeat || new Vector2(1, 1);
    const offset = _offset || new Vector2(0, 0);

    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        ktx2Loader.load(
            url,
            texture => {
                texture.repeat.copy(repeat);
                texture.offset.copy(offset);
                texture.updateMatrix();
                resolve({
                    texture,
                    fetchTime: performance.now() - startTime,
                    memoryOccupied: getKTX2TextureSize(texture),
                });
            },
            undefined,
            err => {
                reject(`loadKTX2:Error loading KTX2 Texture from ${url}: ${err.message}`);
            },
        );
    });
};

const replaceSubstrings = (originalString, replacements) => {
    let newString = originalString;
    for (const key in replacements) {
        newString = newString.replace(key, replacements[key]);
    }
    return newString;
};

export const createMaterial = (
    geometryType,
    useVideoTexture,
    hasNormals,
    textureTypes,
    overrideMaterialProperties,
) => {
    const DEFINES = {
        baseColor: {
            USE_MAP: "",
            MAP_UV: "uv",
        },
        normal: {
            USE_NORMALMAP: "",
            NORMALMAP_UV: "uv",
        },
        metallicRoughness: {
            USE_METALNESSMAP: "",
            METALNESSMAP_UV: "uv",
            USE_ROUGHNESSMAP: "",
            ROUGHNESSMAP_UV: "uv",
        },
        emissive: {
            USE_EMISSIVEMAP: "",
            EMISSIVEMAP_UV: "uv",
        },
        occlusion: {
            USE_AOMAP: "",
            AOMAP_UV: "uv",
        },
    };

    const getShaderDefines = (textureTypes, useVideoTexture) => {
        const defines = {};
        textureTypes.forEach(type => {
            if (DEFINES[type]) {
                Object.assign(defines, DEFINES[type]);
            }
        });

        if (useVideoTexture) {
            defines["DECODE_VIDEO_TEXTURE"] = "";
        }

        return defines;
    };

    const defines = getShaderDefines(textureTypes, useVideoTexture);
    const customUniforms = {
        mixRatio: {
            value: 0,
        },
    };

    if (overrideMaterialProperties) {
        for (const key in overrideMaterialProperties) {
            const propertyValue = overrideMaterialProperties[key];
            if (typeof propertyValue === "number" || typeof propertyValue === "boolean") {
                customUniforms[key] = {
                    value: propertyValue,
                };
            } else if (typeof propertyValue === "object") {
                if (propertyValue.x !== undefined && propertyValue.y !== undefined) {
                    customUniforms[key] = {
                        value: new Vector2(propertyValue.x, propertyValue.y),
                    };
                } else if (Array.isArray(propertyValue) && propertyValue.length === 2) {
                    customUniforms[key] = {
                        value: new Vector2(propertyValue[0], propertyValue[1]),
                    };
                }
            }
        }
    }

    const shaderName = hasNormals ? "physical" : "basic";
    let vertexShader = ShaderLib[shaderName].vertexShader;

    const allUniforms = UniformsUtils.merge([
        ShaderLib[shaderName].uniforms,
        UniformsLib.lights,
        customUniforms,
    ]);

    if (geometryType === GeometryType.Unify) {
        vertexShader = replaceSubstrings(ShaderLib[shaderName].vertexShader, {
            "#include <clipping_planes_pars_vertex>": `#include <clipping_planes_pars_vertex>
attribute vec3 keyframeAPosition;
attribute vec3 keyframeBPosition;
attribute vec3 keyframeANormal;
attribute vec3 keyframeBNormal;
uniform float mixRatio;
uniform vec2 repeat;
uniform vec2 offset;
out vec2 custom_vUv;`,

            "#include <begin_vertex>": `
      vec3 transformed = vec3(position);
      transformed.x += mix(keyframeAPosition.x, keyframeBPosition.x, mixRatio); 
      transformed.y += mix(keyframeAPosition.y, keyframeBPosition.y, mixRatio);
      transformed.z += mix(keyframeAPosition.z, keyframeBPosition.z, mixRatio);
      
      #ifdef USE_ALPHAHASH
      
        vPosition = vec3( transformed );
      
      #endif`,

            "#include <beginnormal_vertex>": `
      vec3 objectNormal = vec3( normal );
      objectNormal.x += mix(keyframeANormal.x, keyframeBNormal.x, mixRatio);
      objectNormal.y += mix(keyframeANormal.y, keyframeBNormal.y, mixRatio);
      objectNormal.z += mix(keyframeANormal.z, keyframeBNormal.z, mixRatio);

      #ifdef USE_TANGENT

        vec3 objectTangent = vec3( tangent.xyz );

      #endif`,
        });
    }

    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader: ShaderLib[shaderName].fragmentShader,
        uniforms: allUniforms,
        defines,
        lights: true,
    });

    return material;
};

export const getSortedSupportedTargets = targets => {
    const supportedTargets = [];

    for (const key in targets) {
        const targetData = targets[key];

        if (targetData.format === "astc/ktx2") {
            if (isMobile || isMobileXRHeadset) {
                supportedTargets.push(key);
            }
        } else {
            supportedTargets.push(key);
        }
    }

    supportedTargets.sort((a, b) => {
        const targetA = targets[a];
        const targetB = targets[b];

        const aPixelPerSec =
            targetA.frameRate *
            targetA.settings.resolution.width *
            targetA.settings.resolution.height;
        const bPixelPerSec =
            targetB.frameRate *
            targetB.settings.resolution.width *
            targetB.settings.resolution.height;
        return aPixelPerSec - bPixelPerSec;
    });

    return supportedTargets;
};

const combineURLs = (baseURL, relativeURL) => {
    if (relativeURL.startsWith("https://") || relativeURL.startsWith("http://")) {
        return relativeURL;
    }
    const baseURLWithoutLastPart = baseURL.substring(0, baseURL.lastIndexOf("/") + 1);
    return baseURLWithoutLastPart + relativeURL;
};

const countHashes = str => {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === "#") {
            count++;
        }
    }
    return count;
};

export const getResourceURL = props => {
    if (props.type === "geometry") {
        if (props.geometryType === GeometryType.Corto) {
            if (props.manifestPath.endsWith(".manifest")) {
                return props.manifestPath.replace(".manifest", ".drcs");
            } else if (props.manifestPath.endsWith(".mp4")) {
                return props.manifestPath.replace(".mp4", ".drcs");
            } else {
                throw new Error("getResourceURL:Invalid manifest path for Corto geometry");
            }
        } else {
            const absolutePlaceholderPath = combineURLs(props.manifestPath, props.path);
            const padLength = countHashes(absolutePlaceholderPath);
            const paddedString = "[" + "#".repeat(padLength) + "]";
            const paddedIndex = props.index.toString().padStart(padLength, "0");

            const absolutePath = replaceSubstrings(absolutePlaceholderPath, {
                "[ext]": FORMAT_TO_EXTENSION[props.format],
                "[target]": props.target,
                [paddedString]: paddedIndex,
            });

            return absolutePath;
        }
    } else if (props.type === "texture") {
        const absolutePlaceholderPath = combineURLs(props.manifestPath, props.path);
        const padLength = countHashes(absolutePlaceholderPath);
        const paddedString = "[" + "#".repeat(padLength) + "]";
        const paddedIndex = props.index.toString().padStart(padLength, "0");

        const absolutePath = replaceSubstrings(absolutePlaceholderPath, {
            "[ext]": FORMAT_TO_EXTENSION[props.format],
            "[target]": props.target,
            "[type]": props.textureType,
            [paddedString]: paddedIndex,
        });

        return absolutePath;
    } else if (props.type === "audio") {
        const absolutePlaceholderPath = combineURLs(props.manifestPath, props.path);
        const absolutePath = replaceSubstrings(absolutePlaceholderPath, {
            "[ext]": FORMAT_TO_EXTENSION[props.format],
        });
        return absolutePath;
    } else {
        throw new Error('getResourceURL:Invalid type. Must be either "geometry" or "texture"');
    }
};

export const getGeometry = ({
    geometryBuffer,
    currentTimeInMS,
    preferredTarget,
    geometryType,
    targets,
    ...props
}) => {
    const keyframeName = props.keyframeName;

    if (geometryBuffer.has(preferredTarget)) {
        const frameRate =
            geometryType === GeometryType.Corto
                ? props.frameRate
                : props.targetData[preferredTarget].frameRate;
        let preferredTargetIndex = (currentTimeInMS * frameRate) / 1000;
        if (geometryType === GeometryType.Unify) {
            preferredTargetIndex =
                keyframeName === "keyframeA"
                    ? Math.floor(preferredTargetIndex)
                    : Math.ceil(preferredTargetIndex);
        } else {
            preferredTargetIndex = Math.round(preferredTargetIndex);
        }

        const collection = geometryBuffer.get(preferredTarget);
        const geometry = collection[preferredTargetIndex];
        if (geometry) {
            return {
                geometry,
                target: preferredTarget,
                index: preferredTargetIndex,
            };
        }
    }

    if (geometryType === GeometryType.Corto) {
        // Corto Volumetrics does not have multiple targets (legacy)
        return false;
    }

    for (const target of targets) {
        if (geometryBuffer.has(target)) {
            let index = (currentTimeInMS * props.targetData[target].frameRate) / 1000;
            if (geometryType === GeometryType.Unify) {
                index = keyframeName === "keyframeA" ? Math.floor(index) : Math.ceil(index);
            } else {
                index = Math.round(index);
            }

            const collection = geometryBuffer.get(target);
            const geometry = collection[index];
            if (geometry) {
                return {
                    geometry,
                    target,
                    index,
                };
            }
        }
    }

    return false;
};

export const getTexture = ({
    textureBuffer,
    currentTimeInMS,
    preferredTarget,
    targets,
    targetData,
}) => {
    if (textureBuffer.has(preferredTarget)) {
        const preferredTargetIndex = Math.round(
            (currentTimeInMS * targetData[preferredTarget].frameRate) / 1000,
        );
        const collection = textureBuffer.get(preferredTarget);
        const texture = collection[preferredTargetIndex];
        if (texture) {
            return {
                texture,
                target: preferredTarget,
                index: preferredTargetIndex,
            };
        }
    }

    for (const target of targets) {
        if (textureBuffer.has(target)) {
            const index = Math.round((currentTimeInMS * targetData[target].frameRate) / 1000);
            const collection = textureBuffer.get(target);
            const texture = collection[index];
            if (texture) {
                return {
                    texture,
                    target,
                    index,
                };
            }
        }
    }

    return false;
};

export const handleMediaAutoplay = ({ audioContext, media, paused }) => {
    const attachEventListeners = () => {
        const canvas = getComponent(Engine.instance.viewerEntity, RendererComponent).canvas;
        const playMedia = () => {
            media.play();
            audioContext.resume();
            paused.set(false);
            window.removeEventListener("pointerdown", playMedia);
            window.removeEventListener("keypress", playMedia);
            window.removeEventListener("touchstart", playMedia);
            canvas.removeEventListener("pointerdown", playMedia);
            canvas.removeEventListener("touchstart", playMedia);
        };
        window.addEventListener("pointerdown", playMedia);
        window.addEventListener("keypress", playMedia);
        window.addEventListener("touchstart", playMedia);
        canvas.addEventListener("pointerdown", playMedia);
        canvas.addEventListener("touchstart", playMedia);
    };

    // Try to play. If it fails, attach event listeners to play on user interaction
    media
        .play()
        .catch(e => {
            if (e.name === "NotAllowedError") {
                attachEventListeners();
                console.log("Ready to play Sir!");
            }
        })
        .then(() => {
            console.log("Media playback started by handleAutoplay");
            paused.set(false);
        });
};
