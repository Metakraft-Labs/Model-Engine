import {
    Button,
    FormControlLabel,
    FormGroup,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";
import { NO_PROXY, getMutableState, useHookstate } from "../../../hyperflux";
import Checkbox from "../../Checkbox";
import Modal from "../../Modal";
import Select from "../../Select";
import { LODList } from "../constants/GLTFPresets";
import { ImportSettingsState } from "../services/ImportSettingsState";
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

const ImageCompressionBox = ({ compressProperties }) => {
    return (
        <>
            <Typography variant={"h3"}>Compress</Typography>
            <Select
                label={"Mode"}
                options={[
                    { label: "ETC1S", value: "ETC1S" },
                    { label: "UASTC", value: "UASTC" },
                ]}
                currentValue={compressProperties.mode.value}
                onChange={val => compressProperties.mode.set(val)}
            />
            <div className="flex items-center gap-2">
                <FormControlLabel
                    control={
                        <Switch
                            checked={compressProperties.flipY.value}
                            onChange={compressProperties.flipY.set}
                        />
                    }
                    label={"Flip Y"}
                />
                <Tooltip
                    title={"If checked, the source images will be Y flipped before compression"}
                >
                    <HiOutlineInformationCircle />
                </Tooltip>
            </div>
            <div className="flex items-center gap-2">
                <FormControlLabel
                    control={
                        <Switch
                            checked={compressProperties.srgb.value}
                            onChange={compressProperties.srgb.set}
                        />
                    }
                    label={"Linear Color Codespace"}
                />
                <Tooltip title={"If checked, the provided map is assumed to be in sRGB space"}>
                    <HiOutlineInformationCircle />
                </Tooltip>
            </div>
            <div className="flex items-center gap-2">
                <FormControlLabel
                    control={
                        <Switch
                            checked={compressProperties.mipmaps.value}
                            onChange={compressProperties.mipmaps.set}
                        />
                    }
                    label={"Minimaps"}
                />
                <Tooltip title={"If checked, the encoder will generate mipmaps"}>
                    <HiOutlineInformationCircle />
                </Tooltip>
            </div>
            <div className="flex items-center gap-2">
                <FormControlLabel
                    control={
                        <Switch
                            checked={compressProperties.normalMap.value}
                            onChange={compressProperties.normalMap.set}
                        />
                    }
                    label={"Normal Map"}
                />
                <Tooltip
                    title={
                        "Tunes several codec parameters so compression works better on normal maps"
                    }
                >
                    <HiOutlineInformationCircle />
                </Tooltip>
            </div>
            {compressProperties.mode.value === "ETC1S" && (
                <>
                    <FormGroup
                        name="quality"
                        label={"Quality"}
                        info={
                            "Sets the ETC1S encoder's quality level, which controls the file size vs. quality tradeoff"
                        }
                    >
                        <TextField
                            value={compressProperties.quality.value}
                            type="number"
                            onChange={compressProperties.quality.set}
                            min={1}
                            max={255}
                        />
                    </FormGroup>
                    <FormGroup
                        name="compressionLevel"
                        label={"Compression Level"}
                        info={
                            "The compression level parameter controls the encoder perf vs. file size tradeoff for ETC1S files. It does not directly control file size vs. quality (see Quality)"
                        }
                    >
                        <TextField
                            value={compressProperties.compressionLevel.value}
                            onChange={compressProperties.compressionLevel.set}
                            type="number"
                            min={0}
                            max={6}
                        />
                    </FormGroup>
                </>
            )}
            {compressProperties.mode.value === "UASTC" && (
                <>
                    <FormGroup
                        name="uastcFlags"
                        label={"UASTC Flags"}
                        info={
                            "Sets the UASTC encoding performance vs. quality tradeoff, and other lesser used UASTC encoder flags. This is a combination of flags"
                        }
                    >
                        <Select
                            options={UASTCFlagOptions}
                            currentValue={compressProperties.uastcFlags.value}
                            onChange={val => compressProperties.uastcFlags.set(val)}
                        />
                    </FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={compressProperties.uastcZstandard.value}
                                onChange={compressProperties.uastcZstandard.set}
                            />
                        }
                        label={"UASTC Zstandard"}
                        name="uastcZstandard"
                    />
                </>
            )}
        </>
    );
};

export default function ImportSettingsPanel() {
    const importSettingsState = useHookstate(getMutableState(ImportSettingsState));
    const compressProperties = useHookstate(
        getMutableState(ImportSettingsState).imageSettings.get(NO_PROXY),
    );

    const [defaultImportFolder, setDefaultImportFolder] = useState(
        importSettingsState.importFolder.value,
    );
    const [LODImportFolder, setLODImportFolder] = useState(importSettingsState.LODFolder.value);
    const [LODGenEnabled, setLODGenEnabled] = useState(importSettingsState.LODsEnabled.value);
    const [selectedLODS, setSelectedLods] = useState(
        importSettingsState.selectedLODS.get(NO_PROXY),
    );
    const [currentLOD, setCurrentLOD] = useState(importSettingsState.selectedLODS[0].get(NO_PROXY));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [KTXEnabled, setKTXEnabled] = useState(importSettingsState.imageCompression.value);

    const presetLabels = ["LOD0", "LOD1", "LOD2"];

    useEffect(() => {
        handleLODChange();
    }, [currentLOD, currentIndex]);

    const handleLODChange = () => {
        const newLODS = [...selectedLODS];
        newLODS.splice(currentIndex, 1, currentLOD);
        setSelectedLods(newLODS);
    };

    const handleSaveChanges = () => {
        importSettingsState.importFolder.set(defaultImportFolder);
        importSettingsState.LODFolder.set(LODImportFolder);
        importSettingsState.LODsEnabled.set(LODGenEnabled);
        importSettingsState.imageCompression.set(KTXEnabled);
        importSettingsState.imageSettings.set(compressProperties.get(NO_PROXY));
        importSettingsState.selectedLODS.set(selectedLODS);
        handleCancel();
    };

    const handleCancel = () => {
        PopoverState.hidePopupover();
    };

    return (
        <Modal title="Import Settings" onClose={PopoverState.hidePopupover} open={true}>
            <TextField
                value={defaultImportFolder}
                onChange={event => setDefaultImportFolder(event.target.value)}
                label="Default Import Folder"
            />
            <Checkbox
                value={LODGenEnabled}
                onChange={() => setLODGenEnabled(!LODGenEnabled)}
                label={"Generate LODs"}
            />
            {LODGenEnabled && (
                <>
                    <TextField
                        label="LODs Folder"
                        value={LODImportFolder}
                        onChange={event => setLODImportFolder(event?.target.value)}
                    />
                    <FormControlLabel label={"LODs to Generate"} />
                    {selectedLODS.slice(0, 3).map((LOD, idx) => (
                        <Select
                            label={LOD.params.dst}
                            description={presetLabels[idx]}
                            key={idx}
                            options={LODList.map(sLOD => ({
                                label: sLOD.params.dst,
                                value: sLOD,
                            }))}
                            currentValue={LOD.params.dst}
                            onChange={value => {
                                setCurrentLOD(value);
                                setCurrentIndex(idx);
                            }}
                        />
                    ))}
                </>
            )}
            <Typography variant={"h4"}>Image Compression Settings</Typography>
            <Checkbox
                label={"Compress to KTX2"}
                value={KTXEnabled}
                onChange={() => setKTXEnabled(!KTXEnabled)}
            />
            {KTXEnabled && <ImageCompressionBox compressProperties={compressProperties} />}

            <Button onClick={handleSaveChanges} color={"success"}>
                Submit
            </Button>
        </Modal>
    );
}
