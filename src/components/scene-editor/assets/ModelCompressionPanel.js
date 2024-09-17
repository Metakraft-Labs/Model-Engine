import React, { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { Group, LoaderUtils } from "three";

import { createEntity, generateEntityUUID, UndefinedEntity, UUIDComponent } from "../../../ecs";
import { getComponent, hasComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { DefaultModelTransformParameters as defaultParams } from "../../../engine/assets/classes/ModelTransform";
import { transformModel as clientSideTransformModel } from "../../../engine/assets/compression/ModelTransformFunctions";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { Heuristic, VariantComponent } from "../../../engine/scene/components/VariantComponent";
import { proxifyParentChildRelationships } from "../../../engine/scene/functions/loadGLTFModel";
import { getState, NO_PROXY, none, useHookstate } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { Object3DComponent } from "../../../spatial/renderer/components/Object3DComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import {
    EntityTreeComponent,
    removeEntityNodeRecursively,
} from "../../../spatial/transform/components/EntityTree";

import { defaultLODs, LODList } from "../constants/GLTFPresets";
import exportGLTF from "../functions/exportGLTF";
import { EditorState } from "../services/EditorServices";
import { PopoverState } from "../services/PopoverState";

import { Button, CircularProgress, Typography } from "@mui/material";
import { HiPlus, HiXMark } from "react-icons/hi2";
import { MdClose } from "react-icons/md";
import ConfirmDialog from "../../ConfirmDialog";
import GLTFTransformProperties from "../properties/GLTFTransformProperties";

const createTempEntity = (name, parentEntity = UndefinedEntity) => {
    const entity = createEntity();
    setComponent(entity, NameComponent, name);
    setComponent(entity, VisibleComponent);
    setComponent(entity, TransformComponent);
    setComponent(entity, EntityTreeComponent, { parentEntity });

    let sceneID = getState(EditorState).scenePath;
    if (hasComponent(parentEntity, SourceComponent)) {
        sceneID = getComponent(parentEntity, SourceComponent);
    }
    setComponent(entity, SourceComponent, sceneID);

    const uuid = generateEntityUUID();
    setComponent(entity, UUIDComponent, uuid);

    // These additional properties and relations are required for
    // the current GLTF exporter to successfully generate a GLTF.
    const obj3d = new Group();
    obj3d.entity = entity;
    addObjectToGroup(entity, obj3d);
    proxifyParentChildRelationships(obj3d);
    setComponent(entity, Object3DComponent, obj3d);

    return entity;
};

export const createLODVariants = async (lods, clientside, heuristic, exportCombined = false) => {
    const lodVariantParams = lods.map(lod => ({
        ...lod.params,
    }));

    const transformMetadata = [];
    for (const [i, variant] of lodVariantParams.entries()) {
        if (clientside) {
            await clientSideTransformModel(variant, (key, data) => {
                if (!transformMetadata[i]) transformMetadata[i] = {};
                transformMetadata[i][key] = data;
            });
        } else {
            // await API.instance.service(modelTransformPath).create(variant);
        }
    }

    if (exportCombined) {
        const modelSrc = `${LoaderUtils.extractUrlBase(lods[0].params.src)}${lods[0].params.dst}.${
            lods[0].params.modelFormat
        }`;
        const result = createTempEntity("container");
        setComponent(result, ModelComponent);
        const variant = createTempEntity("LOD Variant", result);
        setComponent(variant, ModelComponent, { src: modelSrc });
        setComponent(variant, VariantComponent, {
            levels: lods.map((lod, lodIndex) => ({
                src: `${LoaderUtils.extractUrlBase(lod.params.src)}${lod.params.dst}.${lod.params.modelFormat}`,
                metadata: {
                    ...lod.variantMetadata,
                    ...transformMetadata[lodIndex],
                },
            })),
            heuristic,
        });

        await exportGLTF(result, lods[0].params.src.replace(/\.[^.]*$/, `-integrated.gltf`));
        removeEntityNodeRecursively(result);
    }
};

export default function ModelCompressionPanel({ selectedFiles, refreshDirectory }) {
    const compressionLoading = useHookstate(false);
    const selectedLODIndex = useHookstate(0);
    const selectedPreset = useHookstate(defaultParams);
    const presetList = useHookstate(structuredClone(LODList));

    useEffect(() => {
        const presets = localStorage.getItem("presets");
        if (presets !== null) {
            presetList.set(JSON.parse(presets));
        }
    }, []);

    const lods = useHookstate([]);

    const compressContentInBrowser = async () => {
        compressionLoading.set(true);
        for (const file of selectedFiles) {
            await compressModel(file);
        }
        await refreshDirectory();
        compressionLoading.set(false);
    };

    const applyPreset = preset => {
        selectedPreset.set(JSON.parse(JSON.stringify(preset)));
        PopoverState.showPopupover(
            <ConfirmDialog text={"Apply preset?"} onSubmit={confirmPreset} />,
        );
    };

    const confirmPreset = () => {
        const lod = lods[selectedLODIndex.value].get(NO_PROXY);
        const src = lod.params.src;
        const dst = lod.params.dst;
        const modelFormat = lod.params.modelFormat;
        const uri = lod.params.resourceUri;

        const presetParams = JSON.parse(JSON.stringify(selectedPreset.value));
        presetParams.src = src;
        presetParams.dst = dst;
        presetParams.modelFormat = modelFormat;
        presetParams.resourceUri = uri;

        lods[selectedLODIndex.value].params.set(presetParams);
    };

    const savePresetList = () => {
        presetList.merge([JSON.parse(JSON.stringify(lods[selectedLODIndex.value].value))]);
        localStorage.setItem("presets", JSON.stringify(presetList.value));
    };

    const compressModel = async file => {
        const clientside = true;
        const exportCombined = true;

        let fileLODs = lods.value;

        if (selectedFiles.length > 1) {
            fileLODs = fileLODs.map(lod => {
                const src = file.url;
                const fileName = src.split("/").pop()?.split(".").shift();
                const dst = fileName + lod.suffix;
                return {
                    ...lod,
                    src,
                    dst,
                    modelFormat: src.endsWith(".gltf")
                        ? "gltf"
                        : src.endsWith(".vrm")
                          ? "vrm"
                          : "glb",
                };
            });
        }

        const heuristic = Heuristic.BUDGET;
        await createLODVariants(fileLODs, clientside, heuristic, exportCombined);
    };

    const deletePreset = (event, idx) => {
        event.stopPropagation();
        presetList[idx].set(none);
        // presetList.set(presetList.value.filter((_, i) => i !== idx))
        localStorage.setItem("presets", JSON.stringify(presetList.value));
    };

    const handleRemoveLOD = idx => {
        lods.set(currentLods => currentLods.filter((_, i) => i !== idx));
        if (selectedLODIndex.value >= lods.length) {
            selectedLODIndex.set(lods.length - 1);
        }
    };

    useEffect(() => {
        const firstFile = selectedFiles[0];
        if (firstFile == null) {
            return;
        }

        const fullSrc = firstFile.url;
        const fileName = fullSrc.split("/").pop()?.split(".").shift();

        const defaults = defaultLODs.map(defaultLOD => {
            const lod = JSON.parse(JSON.stringify(defaultLOD));
            lod.params.src = fullSrc;
            lod.params.dst = fileName + lod.suffix;
            lod.params.modelFormat = fullSrc.endsWith(".gltf")
                ? "gltf"
                : fullSrc.endsWith(".vrm")
                  ? "vrm"
                  : "glb";
            lod.params.resourceUri = "";
            return lod;
        });

        lods.set(defaults);
    }, [selectedFiles]);

    const handleAddLOD = () => {
        const params = JSON.parse(JSON.stringify(lods[selectedLODIndex.value].params.value));
        const suffix = "-LOD" + lods.length;
        params.dst = params.dst.replace(lods[selectedLODIndex.value].suffix.value, suffix);
        lods.merge([
            {
                params: params,
                suffix: suffix,
                variantMetadata: {},
            },
        ]);
        selectedLODIndex.set(lods.length - 1);
    };

    return (
        <div className="max-h-[80vh] w-[60vw] overflow-y-auto rounded-xl bg-[#0E0F11]">
            <div className="relative flex items-center justify-center px-8 py-3">
                <Typography className="leading-6">Compress</Typography>
                <Button
                    variant="outline"
                    className="absolute right-0 border-0 dark:bg-transparent dark:text-[#A3A3A3]"
                    startIcon={<MdClose />}
                    onClick={() => PopoverState.hidePopupover()}
                />
            </div>
            <div className="px-8 pb-6 pt-2 text-left">
                <Typography className="mb-6 font-semibold">\ Lod Levels</Typography>
                <div className="mb-8 flex gap-x-4">
                    {lods.value.map((_lod, index) => (
                        <span key={index} className="flex items-center">
                            <Button
                                variant="transparent"
                                className={`rounded-none px-1 pb-4 text-sm font-medium ${
                                    selectedLODIndex.value === index
                                        ? "border-b border-blue-primary text-blue-primary"
                                        : "text-[#9CA0AA]"
                                }`}
                                onClick={() =>
                                    selectedLODIndex.set(Math.min(index, lods.length - 1))
                                }
                            >
                                {"Lod Level"} {index + 1}
                            </Button>
                            {selectedLODIndex.value !== index && (
                                <Button
                                    className={twMerge("m-0 p-0 pb-1")}
                                    variant="transparent"
                                    onClick={() => handleRemoveLOD(index)}
                                    startIcon={<HiXMark />}
                                    title="remove"
                                />
                            )}
                        </span>
                    ))}
                    <Button
                        className="self-center rounded-md bg-[#162546] p-1 [&>*]:m-0"
                        variant="transparent"
                        onClick={handleAddLOD}
                    >
                        <HiPlus />
                    </Button>
                </div>

                <div className="my-8 flex items-center justify-around gap-x-1 overflow-x-auto rounded-lg border border-theme-input p-2">
                    {presetList.value.map((lodItem, index) => (
                        <Button
                            key={index}
                            variant="transparent"
                            className="text-nowrap rounded-full bg-[#2F3137] px-2 py-0.5"
                            onClick={() => applyPreset(lodItem.params)}
                            endIcon={
                                !LODList.find(l => l.params.dst === lodItem.params.dst) && (
                                    <HiXMark onClick={event => deletePreset(event, index)} />
                                )
                            }
                        >
                            {lodItem.params.dst}
                        </Button>
                    ))}
                    <Button
                        variant="transparent"
                        className="text-nowrap rounded bg-[#162546] px-3 py-2"
                        onClick={() => savePresetList()}
                    >
                        Save Preset
                    </Button>
                </div>

                <div className="ml-[16.66%] w-4/6">
                    <GLTFTransformProperties
                        transformParms={lods[selectedLODIndex.value].params}
                        itemCount={selectedFiles.length}
                    />
                </div>

                <div className="flex justify-end px-8">
                    {compressionLoading.value ? (
                        <CircularProgress sx={{ mx: 0, height: 12, width: 12 }} />
                    ) : (
                        <Button variant="primary" onClick={compressContentInBrowser}>
                            Compress
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
