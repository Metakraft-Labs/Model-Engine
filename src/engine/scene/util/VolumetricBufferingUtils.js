import { BufferGeometry } from "three";
import { isMobile } from "../../../spatial/common/functions/isMobile";
import { isMobileXRHeadset } from "../../../spatial/xr/XRState";
import { GeometryType, TIME_UNIT_MULTIPLIER } from "../constants/NewUVOLTypes";
import {
    getResourceURL,
    loadDraco,
    loadGLTF,
    loadKTX2,
    rateLimitedCortoLoader,
} from "./VolumetricUtils";

export const bufferLimits = {
    geometry: {
        [GeometryType.Corto]: {
            desktopMaxBufferDuration: 36, // seconds
            mobileMaxBufferDuration: 15,
            initialBufferDuration: 7,
            minBufferDurationToPlay: 4,
        },
        [GeometryType.Draco]: {
            desktopMaxBufferDuration: 4,
            mobileMaxBufferDuration: 3,
            initialBufferDuration: 3,
            minBufferDurationToPlay: 2,
        },
        [GeometryType.Unify]: {
            desktopMaxBufferDuration: 10,
            mobileMaxBufferDuration: 5,
            initialBufferDuration: 3,
            minBufferDurationToPlay: 0.75,
        },
    },
    texture: {
        ["ktx2"]: {
            desktopMaxBufferDuration: 8, // seconds
            mobileMaxBufferDuration: 3,
            initialBufferDuration: 3,
            minBufferDurationToPlay: 0.75,
        },
        ["astc/ktx2"]: {
            desktopMaxBufferDuration: 6, // seconds
            mobileMaxBufferDuration: 3,
            initialBufferDuration: 3,
            minBufferDurationToPlay: 0.75,
        },
    },
};

export const fetchGeometry = ({
    currentTimeInMS,
    bufferData,
    target,
    manifest,
    geometryType,
    manifestPath,
    geometryBuffer,
    mesh,
    initialBufferLoaded,
    startTimeInMS,
    repeat,
    offset,
}) => {
    if (Object.keys(manifest).length === 0) return;
    const currentTime = currentTimeInMS * (TIME_UNIT_MULTIPLIER / 1000);
    const nextMissing = bufferData.getNextMissing(currentTime);

    const frameRate =
        geometryType === GeometryType.Corto
            ? manifest.frameRate
            : manifest.geometry.targets[target].frameRate;
    const frameCount =
        geometryType === GeometryType.Corto
            ? manifest.frameData.length
            : manifest.geometry.targets[target].frameCount;

    const duration =
        geometryType === GeometryType.Corto ? frameCount / frameRate : manifest.duration;

    const startFrame = Math.floor((nextMissing * frameRate) / TIME_UNIT_MULTIPLIER);
    const maxBufferDuration = Math.max(
        0,
        Math.min(
            isMobile || isMobileXRHeadset
                ? bufferLimits.geometry[geometryType].mobileMaxBufferDuration
                : bufferLimits.geometry[geometryType].desktopMaxBufferDuration,
            duration - currentTimeInMS / 1000,
        ),
    );

    if (
        startFrame >= frameCount ||
        nextMissing - currentTime >= maxBufferDuration * TIME_UNIT_MULTIPLIER
    ) {
        return;
    }

    const endFrame = Math.min(
        frameCount - 1,
        Math.floor(
            ((currentTime + maxBufferDuration * TIME_UNIT_MULTIPLIER) * frameRate) /
                TIME_UNIT_MULTIPLIER,
        ),
    );

    if (endFrame < startFrame) return;

    // console.log('fetchGeometry: ', {
    //   currentTime: currentTimeInMS / 1000,
    //   startFrame,
    //   nextMissing: nextMissing / TIME_UNIT_MULTIPLIER,
    //   geometryType,
    //   frameCount,
    //   endFrame,
    //   bufferData
    // })

    if (!geometryBuffer.has(target)) {
        geometryBuffer.set(target, []);
    }
    const collection = geometryBuffer.get(target);

    for (let currentFrame = startFrame; currentFrame <= endFrame; ) {
        const _currentFrame = currentFrame;

        if (geometryType === GeometryType.Corto) {
            const currentFrameStartTime = (_currentFrame * TIME_UNIT_MULTIPLIER) / frameRate;
            const currentFrameEndTime = ((_currentFrame + 1) * TIME_UNIT_MULTIPLIER) / frameRate;

            const currentFrameBufferData = bufferData.getIntersectionDuration(
                currentFrameStartTime,
                currentFrameEndTime,
            );
            if (currentFrameBufferData.missingDuration === 0) {
                currentFrame++;
                continue;
            }

            bufferData.addPendingRange(currentFrameStartTime, currentFrameEndTime);
            const resourceURL = getResourceURL({
                type: "geometry",
                geometryType: GeometryType.Corto,
                manifestPath: manifestPath,
            });
            const byteStart = manifest.frameData[_currentFrame].startBytePosition;
            const byteEnd = byteStart + manifest.frameData[_currentFrame].meshLength;

            rateLimitedCortoLoader(resourceURL, byteStart, byteEnd)
                .then(currentFrameData => {
                    const geometry = currentFrameData.geometry;
                    collection[_currentFrame] = geometry;
                    bufferData.addBufferedRange(currentFrameStartTime, currentFrameEndTime, -1);

                    if (!initialBufferLoaded.value) {
                        const startTime = (startTimeInMS * TIME_UNIT_MULTIPLIER) / 1000;
                        const endTime =
                            startTime +
                            bufferLimits.geometry[geometryType].initialBufferDuration *
                                TIME_UNIT_MULTIPLIER;

                        const startFrameBufferData = bufferData.getIntersectionDuration(
                            startTime,
                            endTime,
                        );
                        if (
                            startFrameBufferData.missingDuration === 0 &&
                            startFrameBufferData.pendingDuration === 0
                        ) {
                            initialBufferLoaded.set(true);
                        }
                    }
                })
                .catch(err => {
                    console.warn("Error in loading corto frame: ", err);
                });
            currentFrame++;
        } else if (geometryType === GeometryType.Draco) {
            const currentFrameStartTime = (_currentFrame * TIME_UNIT_MULTIPLIER) / frameRate;
            const currentFrameEndTime = ((_currentFrame + 1) * TIME_UNIT_MULTIPLIER) / frameRate;

            const currentFrameBufferData = bufferData.getIntersectionDuration(
                currentFrameStartTime,
                currentFrameEndTime,
            );
            if (currentFrameBufferData.missingDuration === 0) {
                currentFrame++;
                continue;
            }

            bufferData.addPendingRange(currentFrameStartTime, currentFrameEndTime);
            const resourceURL = getResourceURL({
                type: "geometry",
                geometryType: geometryType,
                manifestPath: manifestPath,
                target: target,
                index: currentFrame,
                path: manifest.geometry.path,
                format: manifest.geometry.targets[target].format,
            });

            const loadingFunction = geometryType === GeometryType.Draco ? loadDraco : loadGLTF;
            loadingFunction(resourceURL)
                .then(currentFrameData => {
                    const geometry =
                        geometryType === GeometryType.Draco
                            ? currentFrameData.geometry
                            : currentFrameData.mesh;
                    collection[currentFrame] = geometry;
                    bufferData.addBufferedRange(currentFrameStartTime, currentFrameEndTime, -1);

                    if (!initialBufferLoaded.value) {
                        const startTime = (startTimeInMS * TIME_UNIT_MULTIPLIER) / 1000;
                        const endTime =
                            startTime +
                            bufferLimits.geometry[geometryType].initialBufferDuration *
                                TIME_UNIT_MULTIPLIER;

                        const startFrameBufferData = bufferData.getIntersectionDuration(
                            startTime,
                            endTime,
                        );
                        if (
                            startFrameBufferData.missingDuration === 0 &&
                            startFrameBufferData.pendingDuration === 0
                        ) {
                            initialBufferLoaded.set(true);
                        }
                    }
                })
                .catch(err => {
                    console.warn("Error in loading draco frame: ", err);
                });
            currentFrame++;
        } else if (geometryType === GeometryType.Unify) {
            const targetData = manifest.geometry.targets[target];
            const segmentFrameCount = targetData.segmentFrameCount;
            const segmentIndex = Math.floor(_currentFrame / segmentFrameCount);
            const segmentOffset = segmentIndex * segmentFrameCount;

            const currentSegmentStartTime =
                segmentIndex * targetData.settings.segmentSize * TIME_UNIT_MULTIPLIER;
            const currentSegmentEndTime =
                (segmentIndex + 1) * targetData.settings.segmentSize * TIME_UNIT_MULTIPLIER;

            const currentFrameBufferData = bufferData.getIntersectionDuration(
                currentSegmentStartTime,
                currentSegmentEndTime,
            );
            if (currentFrameBufferData.missingDuration === 0) {
                currentFrame += segmentFrameCount;
                continue;
            }

            bufferData.addPendingRange(currentSegmentStartTime, currentSegmentEndTime);
            const resourceURL = getResourceURL({
                type: "geometry",
                geometryType: GeometryType.Unify,
                manifestPath: manifestPath,
                target: target,
                index: segmentIndex,
                path: manifest.geometry.path,
                format: "uniform-solve",
            });

            loadGLTF(resourceURL)
                .then(currentFrameData => {
                    const positionMorphAttributes =
                        currentFrameData.mesh.geometry.morphAttributes.position;
                    const normalMorphAttributes =
                        currentFrameData.mesh.geometry.morphAttributes.normal;

                    // console.log('Segment Mesh: ', currentFrameData.mesh)

                    positionMorphAttributes.map((attribute, index) => {
                        collection[segmentOffset + index] = {
                            position: attribute,
                            normal: normalMorphAttributes
                                ? normalMorphAttributes[index]
                                : undefined,
                        };
                    });

                    if (
                        mesh.geometry.attributes.position.count !==
                        currentFrameData.mesh.geometry.attributes.position.count
                    ) {
                        if (currentFrameData.mesh.materialStandardMaterial.map) {
                            const texture = currentFrameData.mesh.materialStandardMaterial.map;
                            if (texture) {
                                repeat.current.copy(texture.repeat);
                                offset.current.copy(texture.offset);
                            }
                        }

                        console.log("Initiailizing Unify Geometry");

                        const material = mesh.material;

                        // @ts-ignore
                        mesh.copy(currentFrameData.mesh);
                        mesh.material = material;
                        mesh.material.needsUpdate = true;

                        for (const attribute in currentFrameData.mesh.geometry.attributes) {
                            mesh.geometry.attributes[attribute] =
                                currentFrameData.mesh.geometry.attributes[attribute];
                            mesh.geometry.attributes[attribute].needsUpdate = true;
                        }
                        if (currentFrameData.mesh.geometry.index) {
                            mesh.geometry.index = currentFrameData.mesh.geometry.index;
                            mesh.geometry.index.needsUpdate = true;
                        }

                        mesh.geometry.morphAttributes = {};
                        mesh.morphTargetDictionary = undefined;
                        mesh.morphTargetInfluences = undefined;
                    }

                    bufferData.addBufferedRange(
                        currentSegmentStartTime,
                        currentSegmentEndTime,
                        currentFrameData.fetchTime,
                    );

                    if (!initialBufferLoaded.value) {
                        const startTime = (startTimeInMS * TIME_UNIT_MULTIPLIER) / 1000;
                        const endTime =
                            startTime +
                            bufferLimits.geometry[geometryType].initialBufferDuration *
                                TIME_UNIT_MULTIPLIER;

                        const startFrameBufferData = bufferData.getIntersectionDuration(
                            startTime,
                            endTime,
                        );
                        if (
                            startFrameBufferData.missingDuration === 0 &&
                            startFrameBufferData.pendingDuration === 0
                        ) {
                            initialBufferLoaded.set(true);
                        }
                    }
                })
                .catch(err => {
                    console.warn("Error in loading unify frame: ", err);
                });
            currentFrame += segmentFrameCount;
        }
    }
};

export const deleteUsedGeometryBuffers = ({
    currentTimeInMS,
    bufferData,
    geometryType,
    geometryBuffer,
    targetData,
    frameRate,
    mesh,
    clearAll = false,
}) => {
    if (geometryType === GeometryType.Corto || geometryType === GeometryType.Draco) {
        let _frameRate = frameRate || 1;

        for (const [target, collection] of geometryBuffer) {
            if (!geometryBuffer.has(target) || !collection || !targetData || !targetData[target]) {
                continue;
            }
            if (geometryType === GeometryType.Draco) {
                _frameRate = targetData ? targetData[target].frameRate : 1;
            }

            const toBeDeletedKeys = [];

            collection.every((geometryObj, frameNo) => {
                const frameStartTimeInMS = (frameNo * 1000) / _frameRate;
                const frameEndTimeInMS = ((frameNo + 1) * 1000) / _frameRate;
                if (!clearAll && frameEndTimeInMS >= currentTimeInMS) {
                    return false;
                }

                geometryObj.dispose();
                toBeDeletedKeys.push(frameNo);
                if (!clearAll && bufferData) {
                    bufferData.removeBufferedRange(
                        frameStartTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                        frameEndTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                    );
                }
                return true;
            });

            toBeDeletedKeys.forEach(key => {
                delete collection[key];
            });
        }
    } else if (geometryType === GeometryType.Unify) {
        const oldGeometry = mesh.geometry;

        const index = mesh.geometry.index;
        const newGeometry = new BufferGeometry();

        newGeometry.setIndex(index);
        for (const key in mesh.geometry.attributes) {
            newGeometry.setAttribute(key, mesh.geometry.attributes[key]);
            oldGeometry.deleteAttribute(key);
        }
        newGeometry.boundingSphere = mesh.geometry.boundingSphere;
        newGeometry.boundingBox = mesh.geometry.boundingBox;

        mesh.geometry = newGeometry;

        for (const [target, collection] of geometryBuffer) {
            if (!geometryBuffer.has(target) || !collection || !targetData || !targetData[target]) {
                continue;
            }

            const toBeDeletedKeys = [];
            const _frameRate = targetData ? targetData[target].frameRate : 1;

            collection.every((geometryObj, frameNo) => {
                const frameStartTimeInMS = (frameNo * 1000) / _frameRate;
                const frameEndTimeInMS = ((frameNo + 1) * 1000) / _frameRate;
                if (!clearAll && frameEndTimeInMS >= currentTimeInMS) {
                    return false;
                }

                const _obj = geometryObj;
                oldGeometry.setAttribute(`position_${frameNo}`, _obj.position);
                if (_obj.normal) {
                    oldGeometry.setAttribute(`normal_${frameNo}`, _obj.normal);
                }

                toBeDeletedKeys.push(frameNo);
                if (!clearAll && bufferData) {
                    bufferData.removeBufferedRange(
                        frameStartTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                        frameEndTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                    );
                }

                return true;
            });

            toBeDeletedKeys.forEach(key => {
                delete collection[key];
            });
            oldGeometry.dispose();
        }
    }
};

export const fetchTextures = ({
    currentTimeInMS,
    bufferData,
    target,
    manifest,
    textureType,
    manifestPath,
    textureBuffer,
    textureFormat,
    initialBufferLoaded,
    startTimeInMS,
}) => {
    const currentTime = currentTimeInMS * (TIME_UNIT_MULTIPLIER / 1000);

    const nextMissing = bufferData.getNextMissing(currentTime);

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const frameRate = manifest.texture[textureType]?.targets[target].frameRate;

    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const frameCount = manifest.texture[textureType]?.targets[target].frameCount;

    const startFrame = Math.floor((nextMissing * frameRate) / TIME_UNIT_MULTIPLIER);
    const maxBufferDuration = Math.max(
        0,
        Math.min(
            isMobile || isMobileXRHeadset
                ? bufferLimits.texture[textureFormat].mobileMaxBufferDuration
                : bufferLimits.texture[textureFormat].desktopMaxBufferDuration,
            manifest.duration - currentTimeInMS / 1000,
        ),
    );

    if (
        startFrame >= frameCount ||
        nextMissing - currentTime >= maxBufferDuration * TIME_UNIT_MULTIPLIER
    ) {
        return;
    }

    const endFrame = Math.min(
        frameCount - 1,
        Math.floor(
            ((currentTime + maxBufferDuration * TIME_UNIT_MULTIPLIER) * frameRate) /
                TIME_UNIT_MULTIPLIER,
        ),
    );

    if (endFrame < startFrame) return;

    if (!textureBuffer.has(target)) {
        textureBuffer.set(target, []);
    }
    const collection = textureBuffer.get(target);

    for (let currentFrame = startFrame; currentFrame <= endFrame; currentFrame++) {
        const _currentFrame = currentFrame;
        const currentFrameStartTime =
            frameRate > 0 ? (_currentFrame * TIME_UNIT_MULTIPLIER) / frameRate : 0;
        const currentFrameEndTime =
            frameRate > 0
                ? ((_currentFrame + 1) * TIME_UNIT_MULTIPLIER) / frameRate
                : manifest.duration * TIME_UNIT_MULTIPLIER;
        const currentFrameBufferData = bufferData.getIntersectionDuration(
            currentFrameStartTime,
            currentFrameEndTime,
        );
        if (currentFrameBufferData.missingDuration === 0) {
            continue;
        }

        bufferData.addPendingRange(currentFrameStartTime, currentFrameEndTime);

        const resourceURL = getResourceURL({
            type: "texture",
            textureType: textureType,
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
            format: manifest.texture[textureType]?.targets[target].format,
            index: _currentFrame,
            target: target,
            path: manifest.texture["baseColor"].path,
            manifestPath: manifestPath,
        });

        loadKTX2(resourceURL)
            .then(currentFrameData => {
                collection[_currentFrame] = currentFrameData.texture;

                bufferData.addBufferedRange(
                    currentFrameStartTime,
                    currentFrameEndTime,
                    currentFrameData.fetchTime,
                );

                if (!initialBufferLoaded.value) {
                    const startTime = (startTimeInMS * TIME_UNIT_MULTIPLIER) / 1000;
                    const endTime =
                        startTime +
                        bufferLimits.texture[textureFormat].initialBufferDuration *
                            TIME_UNIT_MULTIPLIER;

                    const startFrameBufferData = bufferData.getIntersectionDuration(
                        startTime,
                        endTime,
                    );
                    if (
                        startFrameBufferData.missingDuration === 0 &&
                        startFrameBufferData.pendingDuration === 0
                    ) {
                        initialBufferLoaded.set(true);
                    }
                }
            })
            .catch(err => {
                console.warn("Error in loading ktx2 frame: ", err);
            });
    }
};

export const deleteUsedTextureBuffers = ({
    currentTimeInMS,
    bufferData,
    textureBuffer,
    textureType,
    targetData,
    clearAll = false,
}) => {
    for (const [target, collection] of textureBuffer) {
        if (!collection || !targetData || !targetData[target]) {
            continue;
        }

        const _frameRate = targetData ? targetData[target].frameRate : 1;

        if (_frameRate === 0) {
            // TODO: Handle this case
            continue;
        }

        const toBeDeletedKeys = [];

        collection.every((texture, frameNo) => {
            const frameStartTimeInMS = (frameNo * 1000) / _frameRate;
            const frameEndTimeInMS = ((frameNo + 1) * 1000) / _frameRate;

            if (_frameRate === 0) {
                if (clearAll) {
                    texture.dispose();
                    toBeDeletedKeys.push(frameNo);
                    if (bufferData) {
                        bufferData?.removeBufferedRange(0, Infinity);
                    }
                }

                return false;
            }

            if (!clearAll && frameEndTimeInMS >= currentTimeInMS) {
                return false;
            }

            texture.dispose();
            toBeDeletedKeys.push(frameNo);
            if (!clearAll && bufferData) {
                bufferData.removeBufferedRange(
                    frameStartTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                    frameEndTimeInMS * (TIME_UNIT_MULTIPLIER / 1000),
                );
            }
            return true;
        });

        toBeDeletedKeys.forEach(key => {
            delete collection[key];
        });
    }
};
