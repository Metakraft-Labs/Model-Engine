import {
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { HiLink } from "react-icons/hi2";
import { saveSceneGLTF } from "../../editor/src/functions/sceneFunctions";
import { EditorState } from "../../editor/src/services/EditorServices";
import { useFind, useMutation } from "../../hooks/feathersHooks";
import { getState, useHookstate } from "../../hyperflux";
import Modal from "../Modal";

const getDefaultErrors = () => ({
    name: "",
    maxUsers: "",
    scene: "",
    serverError: "",
});

const locationTypeOptions = [
    { label: "Private", value: "private" },
    { label: "Public", value: "public" },
    { label: "Showroom", value: "showroom" },
];

export default function AddEditSceneModal(props) {
    const locationID = useHookstate(props.location?.id || null);
    const [copied, setCopied] = useState(false);

    const locationQuery = useFind("location", { query: { id: locationID.value } });
    const location = locationID.value ? locationQuery.data[0] : null;

    const locationMutation = useMutation("location");

    const sceneModified = EditorState.useIsModified();

    const publishLoading = useHookstate(false);
    const unPublishLoading = useHookstate(false);
    const isLoading =
        locationQuery.status === "pending" || publishLoading.value || unPublishLoading.value;
    const errors = useHookstate(getDefaultErrors());

    const name = useHookstate(location?.name || "");
    const maxUsers = useHookstate(location?.maxUsersPerInstance || 20);

    const scene = useHookstate((location ? location.sceneId : props.sceneID) || "");
    const videoEnabled = useHookstate(location?.locationSetting.videoEnabled || true);
    const audioEnabled = useHookstate(location?.locationSetting.audioEnabled || true);
    const screenSharingEnabled = useHookstate(
        location?.locationSetting.screenSharingEnabled || true,
    );
    const locationType = useHookstate(location?.locationSetting.locationType || "public");

    useEffect(() => {
        if (location) {
            name.set(location.name);
            maxUsers.set(location.maxUsersPerInstance);
            videoEnabled.set(location.locationSetting.videoEnabled);
            audioEnabled.set(location.locationSetting.audioEnabled);
            screenSharingEnabled.set(location.locationSetting.screenSharingEnabled);
            locationType.set(location.locationSetting.locationType);

            if (!props.sceneID) scene.set(location.sceneId);
        }
    }, [location]);

    const scenes = useFind("static-resource", {
        query: {
            paginate: false,
            type: "scene",
        },
    });

    const handlePublish = async () => {
        errors.set(getDefaultErrors());

        if (!name.value) {
            errors.name.set("Scene name cannot be empty");
        }
        if (!maxUsers.value) {
            errors.maxUsers.set("Maximum users cannot be empty");
        }
        if (!scene.value) {
            errors.scene.set("Scene cannot be empty");
        }
        if (Object.values(errors.value).some(value => value.length > 0)) {
            return;
        }

        publishLoading.set(true);

        if (sceneModified) {
            try {
                const { sceneAssetID, projectName, sceneName, rootEntity } = getState(EditorState);
                if (!sceneAssetID || !projectName || !sceneName || !rootEntity)
                    throw new Error("Cannot save scene without scene data");
                const abortController = new AbortController();
                await saveSceneGLTF(sceneAssetID, projectName, sceneName, abortController.signal);
            } catch (e) {
                errors.serverError.set(e.message);
                publishLoading.set(false);
                return;
            }
        }

        const locationData = {
            name: name.value,
            slugifiedName: "",
            sceneId: scene.value,
            maxUsersPerInstance: maxUsers.value,
            locationSetting: {
                id: "",
                locationId: "",
                locationType: locationType.value,
                audioEnabled: audioEnabled.value,
                screenSharingEnabled: screenSharingEnabled.value,
                faceStreamingEnabled: false,
                videoEnabled: videoEnabled.value,
                createdAt: "",
                updatedAt: "",
            },
            isLobby: false,
            isFeatured: false,
        };

        try {
            if (location?.id) {
                await locationMutation.patch(location.id, locationData, {
                    query: { projectId: location.projectId },
                });
            } else {
                const response = await locationMutation.create(locationData);
                locationID.set(response.id);
            }
            await locationQuery.refetch();
        } catch (err) {
            errors.serverError.set(err.message);
        }
        publishLoading.set(false);
    };

    const unPublishLocation = async () => {
        if (location?.id) {
            unPublishLoading.set(true);
            try {
                await locationMutation.remove(location.id, {
                    query: { projectId: location.projectId },
                });
                locationID.set(null);
                await locationQuery.refetch();
            } catch (err) {
                errors.serverError.set(err.message);
            }
            unPublishLoading.set(false);
        }
    };

    return (
        <Modal
            heading={location?.id ? "Update Scene" : "Create Scene"}
            onClose={props.onClose}
            open={props.open}
        >
            {errors.serverError.value && (
                <p style={{ marginBottom: "10px", color: "#e22a2a" }}>{errors.serverError.value}</p>
            )}
            {location && (
                <Tooltip title={copied ? "Copied!" : "Click to copy the link"}>
                    <Button
                        variant="text"
                        endIcon={
                            <HiLink
                                onClick={() => {
                                    navigator.clipboard.writeText(new URL(location.url).href);
                                    setCopied(true);
                                    setTimeout(() => {
                                        setCopied(false);
                                    }, 2000);
                                }}
                            />
                        }
                    >
                        <Box
                            sx={{
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                                color: "blue",
                            }}
                            onClick={() => window.open(new URL(location.url))}
                        >
                            {location.url}
                        </Box>
                    </Button>
                </Tooltip>
            )}
            <TextField
                label={"Name"}
                value={name.value}
                onChange={event => name.set(event.target.value)}
                error={!!errors.name.value}
                helperText={errors.name.value}
                disabled={isLoading}
            />
            <TextField
                type="number"
                label={"Max Users"}
                value={maxUsers.value}
                onChange={event => maxUsers.set(Math.max(parseInt(event.target.value, 0), 0))}
                error={!!errors.maxUsers.value}
                helperText={errors.maxUsers.value}
                disabled={isLoading}
            />
            <Select
                label={"Type"}
                value={locationType.value}
                onChange={value => locationType.set(value)}
                options={locationTypeOptions}
                disabled={isLoading}
            >
                <MenuItem value={""}>Select Type</MenuItem>
                {locationTypeOptions?.map((option, i) => {
                    return (
                        <MenuItem value={option.value} key={`scene-type-option-${i}`}>
                            {option.label}
                        </MenuItem>
                    );
                })}
            </Select>
            <FormControlLabel
                control={
                    <Switch
                        checked={videoEnabled.value}
                        onChange={e => videoEnabled.set(e.target.checked)}
                    />
                }
                label="Enable Video"
                disabled={isLoading}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={audioEnabled.value}
                        onChange={e => audioEnabled.set(e.target.checked)}
                    />
                }
                label="Enable Audio"
                disabled={isLoading}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={screenSharingEnabled.value}
                        onChange={e => screenSharingEnabled.set(e.target.checked)}
                    />
                }
                label="Enable Screen Sharing"
                disabled={isLoading}
            />

            <Box display={"flex"} justifyContent={"end"} gap={"10px"}>
                <Button variant="outline" onClick={props.onClose}>
                    Cancel
                </Button>
                {location?.id && (
                    <Button
                        sx={{
                            backgroundColor: "#162546",
                        }}
                        endIcon={
                            unPublishLoading.value ? (
                                <CircularProgress height={"6px"} width={"6px"} />
                            ) : undefined
                        }
                        disabled={isLoading}
                        onClick={unPublishLocation}
                    >
                        Unpublish
                    </Button>
                )}
                <Button
                    endIcon={
                        publishLoading.value ? (
                            <CircularProgress height={"6px"} width={"6px"} />
                        ) : undefined
                    }
                    disabled={isLoading}
                    onClick={handlePublish}
                >
                    {location?.id ? "Update" : sceneModified ? "Save and Publish" : "Publish"}
                </Button>
            </Box>
        </Modal>
    );
}
