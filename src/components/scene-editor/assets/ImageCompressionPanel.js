import React from "react";

import { fileBrowserUploadPath } from "../../../common/src/schema.type.module";
import { KTX2EncodeDefaultArguments } from "../../../engine/assets/constants/CompressionParms";
import { useHookstate } from "../../../hyperflux";
import { KTX2Encoder } from "../../../xrui/core/textures/KTX2Encoder";
import { uploadToFeathersService } from "../util/upload";

import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import BooleanInput from "../../Boolean";
import InputGroup from "../../Group";
import { default as Select, default as SelectInput } from "../../Select";
import Slider from "../../Slider";
import { PopoverState } from "../services/PopoverState";

const UASTCFlagOptions = [
    { label: "Fastest", value: 0 },
    { label: "Faster", value: 1 },
    { label: "Default", value: 2 },
    { label: "Slower", value: 3 },
    { label: "Very Slow", value: 4 },
    { label: "Mask", value: 0xf },
    { label: "UASTC Error", value: 8 },
    { label: "BC7 Error", value: 16 },
    { label: "Faster Hints", value: 64 },
    { label: "Fastest Hints", value: 128 },
    { label: "Disable Flip and Individual", value: 256 },
];

export default function ImageCompressionPanel({ selectedFiles, refreshDirectory }) {
    const { t } = useTranslation();

    const compressProperties = useHookstate(KTX2EncodeDefaultArguments);
    const compressionLoading = useHookstate(false);

    const compressContentInBrowser = async () => {
        compressionLoading.set(true);

        for (const file of selectedFiles) {
            await compressImage(file);
        }
        await refreshDirectory();

        compressionLoading.set(false);
        PopoverState.hidePopupover();
    };

    const compressImage = async props => {
        compressProperties.src.set(
            props.type === "folder" ? `${props.url}/${props.key}` : props.url,
        );

        const ktx2Encoder = new KTX2Encoder();

        const img =
            (await new Promise()) <
            HTMLImageElement >
            (resolve => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function () {
                    resolve(img);
                };
                img.src = compressProperties.src.value;
            });

        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        const data = await ktx2Encoder.encode(imageData, {
            uastc: compressProperties.mode.value === "UASTC",
            qualityLevel: compressProperties.quality.value,
            mipmaps: compressProperties.mipmaps.value,
            compressionLevel: compressProperties.compressionLevel.value,
            yFlip: compressProperties.flipY.value,
            srgb: !compressProperties.srgb.value,
            uastcFlags: compressProperties.uastcFlags.value,
            normalMap: compressProperties.normalMap.value,
            uastcZstandard: compressProperties.uastcZstandard.value,
        });

        const newFileName = props.key.replace(/.*\/(.*)\..*/, "$1") + ".ktx2";
        const path = props.key.replace(/(.*\/).*/, "$1");
        const projectName = props.key.split("/")[1]; // TODO: support projects with / in the name
        const relativePath = path.replace("projects/" + "default-project" + "/", "");

        const file = new File([data], newFileName, { type: "image/ktx2" });

        try {
            await uploadToFeathersService(fileBrowserUploadPath, [file], {
                args: [
                    {
                        project: projectName,
                        path: relativePath + file.name,
                        contentType: file.type,
                    },
                ],
            }).promise;
        } catch (err) {
            toast.error(err.message);
        }
    };

    let title;
    if (selectedFiles.length === 1) {
        title = selectedFiles[0].name;
    } else {
        title = selectedFiles.length + " Items";
    }

    return (
        <Box
            sx={{
                maxHeight: "80vh",
                width: "680px",
                overflowY: "auto",
                borderRadius: "15px",
                background: "#0E0F11",
            }}
        >
            <div className="relative mb-3 flex items-center justify-center px-8 py-3">
                <Typography variant={"h6"}>Compress Image</Typography>
                <Button
                    variant="outline"
                    className="absolute right-0 border-0 dark:bg-transparent dark:text-[#A3A3A3]"
                    startIcon={<MdClose />}
                    onClick={() => PopoverState.hidePopupover()}
                />
            </div>

            <div className="mx-auto grid w-1/2 gap-y-2">
                <TextField
                    sx={{
                        background: "#141619",
                    }}
                    className="border-theme-input bg-[#141619] px-2 py-1.5"
                    value={title}
                    disabled
                    label={"File name"}
                    name={mode}
                />
                <div className="w-full border border-[#2B2C30]" />
                <Select
                    label={"Mode"}
                    name={"mode"}
                    fullWidth
                    inputClassName="px-2 py-0.5 text-theme-input text-sm"
                    options={[
                        { label: "ETC1S", value: "ETC1S" },
                        { label: "UASTC", value: "UASTC" },
                    ]}
                    currentValue={compressProperties.mode.value}
                    onChange={val => compressProperties.mode.set(val)}
                />
                <InputGroup
                    name="flipY"
                    label={"Flip Y"}
                    info={"If checked, the source images will be Y flipped before compression"}
                >
                    <BooleanInput
                        sx={{
                            backgroundColor: "#141619",
                        }}
                        value={compressProperties.flipY.value}
                        onChange={compressProperties.flipY.set}
                    />
                </InputGroup>
                <InputGroup
                    name="linear"
                    label={"Linear Color Space"}
                    info={"If checked, the provided map is assumed to be in sRGB space"}
                >
                    <BooleanInput
                        sx={{
                            backgroundColor: "#141619",
                        }}
                        value={compressProperties.srgb.value}
                        onChange={compressProperties.srgb.set}
                    />
                </InputGroup>
                <InputGroup
                    name="mipmaps"
                    label={"Minimaps"}
                    info={"If checked, the encoder will generate mipmaps"}
                >
                    <BooleanInput
                        sx={{
                            backgroundColor: "#141619",
                        }}
                        value={compressProperties.mipmaps.value}
                        onChange={compressProperties.mipmaps.set}
                    />
                </InputGroup>
                <InputGroup
                    name="normalMap"
                    label={"Normal Map"}
                    info={
                        "Tunes several codec parameters so compression works better on normal maps"
                    }
                >
                    <BooleanInput
                        sx={{
                            backgroundColor: "#141619",
                        }}
                        value={compressProperties.normalMap.value}
                        onChange={compressProperties.normalMap.set}
                    />
                </InputGroup>
                {compressProperties.mode.value === "ETC1S" && (
                    <>
                        <InputGroup
                            name="quality"
                            label={"Quality"}
                            info={
                                "Sets the ETC1S encoder's quality level, which controls the file size vs. quality tradeoff"
                            }
                        >
                            <Slider
                                className="bg-theme-studio-surface [&::-moz-range-track]:bg-theme-studio-surface"
                                width={160}
                                value={compressProperties.quality.value}
                                onChange={compressProperties.quality.set}
                                onRelease={compressProperties.quality.set}
                                min={1}
                                max={255}
                                step={1}
                            />
                        </InputGroup>
                        <InputGroup
                            name="compressionLevel"
                            label={"Compression Level"}
                            info={
                                "The compression level parameter controls the encoder perf vs. file size tradeoff for ETC1S files. It does not directly control file size vs. quality (see Quality)"
                            }
                        >
                            <Slider
                                className="bg-theme-studio-surface [&::-moz-range-track]:bg-theme-studio-surface"
                                width={160}
                                value={compressProperties.compressionLevel.value}
                                onChange={compressProperties.compressionLevel.set}
                                onRelease={compressProperties.compressionLevel.set}
                                min={0}
                                max={6}
                                step={1}
                            />
                        </InputGroup>
                    </>
                )}
                {compressProperties.mode.value === "UASTC" && (
                    <>
                        <InputGroup
                            name="uastcFlags"
                            label={"UASTC Flags"}
                            info={
                                "Sets the UASTC encoding performance vs. quality tradeoff, and other lesser used UASTC encoder flags. This is a combination of flags"
                            }
                        >
                            <SelectInput
                                className="w-full"
                                options={UASTCFlagOptions}
                                value={compressProperties.uastcFlags.value}
                                onChange={val => compressProperties.uastcFlags.set(val)}
                            />
                        </InputGroup>
                        <InputGroup
                            name="uastcZstandard"
                            label={"UASTC Zstandard"}
                            info={"Use UASTC Zstandard supercompression"}
                        >
                            <BooleanInput
                                className="bg-[#141619]"
                                value={compressProperties.uastcZstandard.value}
                                onChange={compressProperties.uastcZstandard.set}
                            />
                        </InputGroup>
                    </>
                )}
            </div>

            <Box display={"flex"} mb={6} px={8} justifyContent={"end"}>
                {compressionLoading.value ? (
                    <CircularProgress sx={{ height: "12px", width: "12px" }} />
                ) : (
                    <Button variant="primary" onClick={compressContentInBrowser}>
                        Compress
                    </Button>
                )}
            </Box>
        </Box>
    );
}
