import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Typography } from "@mui/material";
import { HiPencil, HiPlus, HiXMark } from "react-icons/hi2";
import { RiSave2Line } from "react-icons/ri";
import {
    StaticResourceType,
    UserType,
    staticResourcePath,
} from "../../../../../common/src/schema.type.module";
import { NO_PROXY, getMutableState, useHookstate } from "../../../../../hyperflux";
import { useFind } from "../../../../../spatial/common/functions/FeathersHooks";
import Button from "../../../../Button";
import Input from "../../../../Input";
import Modal from "../../../../Modal/Model2";
import { FileThumbnailJobState } from "../../../services/FileThumbnailJobState";
import { PopoverState } from "../../../services/PopoverState";
import { createFileDigest, createStaticResourceDigest } from "../container";

export default function FilePropertiesModal({ projectName, files }) {
    const itemCount = files.length;
    if (itemCount === 0) return null;
    const { t } = useTranslation();

    const fileStaticResources = useHookstate([]);
    const fileDigest = createFileDigest(files);
    const resourceDigest = useHookstate < StaticResourceType > createStaticResourceDigest([]);
    const sharedFields = useHookstate([]);
    const modifiedFields = useHookstate([]);
    const editedField = (useHookstate < string) | (null > null);
    const tagInput = useHookstate("");
    const sharedTags = useHookstate([]);

    let title;
    let filename;
    if (itemCount === 1) {
        const firstFile = files[0];
        filename = firstFile.name;
        title = t("editor:layout.filebrowser.fileProperties.header", {
            fileName: filename.toUpperCase(),
        });
    } else {
        filename = t("editor:layout.filebrowser.fileProperties.mixedValues");
        title = t("editor:layout.filebrowser.fileProperties.header-plural", { itemCount });
    }

    const onChange = (fieldName, state) => {
        return e => {
            if (!modifiedFields.value.includes(fieldName)) {
                modifiedFields.set([...modifiedFields.value, fieldName]);
            }
            state.set(e.target.value);
        };
    };

    const handleRegenerateThumbnail = () => {
        for (const resource of fileStaticResources.value) {
            getMutableState(FileThumbnailJobState).merge([
                {
                    key: resource.url,
                    project: resource.project,
                    id: resource.id,
                },
            ]);
        }
    };

    const handleSubmit = async () => {
        if (modifiedFields.value.length > 0) {
            const addedTags = resourceDigest.tags.value.filter(
                tag => !sharedTags.value.includes(tag),
            );
            const removedTags = sharedTags.value.filter(
                tag => !resourceDigest.tags.value.includes(tag),
            );
            for (const resource of fileStaticResources.value) {
                const oldTags = resource.tags ?? [];
                const newTags = Array.from(
                    new Set([...addedTags, ...oldTags.filter(tag => !removedTags.includes(tag))]),
                );
                // await API.instance.service(staticResourcePath).patch(resource.id, {
                //     key: resource.key,
                //     tags: newTags,
                //     licensing: resourceDigest.licensing.value,
                //     attribution: resourceDigest.attribution.value,
                //     project: projectName,
                // });
            }
            modifiedFields.set([]);
            PopoverState.hidePopupover();
        }
    };

    const query = {
        key: {
            $like: undefined,
            $or: files.map(({ key }) => ({
                key,
            })),
        },
        $limit: 10000,
    };

    const resources = useFind(staticResourcePath, { query });
    useEffect(() => {
        if (resources.data.length === 0) return;
        // API.instance
        //     .service("user")
        //     .get(resources.data[0].userId)
        //     .then(user => author.set(user));

        fileStaticResources.set(resources.data);
        const digest = createStaticResourceDigest(resources.data);
        resourceDigest.set(digest);
        sharedFields.set(
            Object.keys(resourceDigest).filter(key => {
                const value = resourceDigest[key];
                return value.length !== "";
            }),
        );
        sharedTags.set(resourceDigest.tags.get(NO_PROXY).slice());
    }, [resources.data.length]);

    const author = (useHookstate < UserType) | (null > null);

    const handleAddTag = () => {
        if (tagInput.value != "" && !resourceDigest.tags.value.includes(tagInput.value)) {
            if (!modifiedFields.value.includes("tags")) {
                modifiedFields.set([...modifiedFields.value, "tags"]);
            }
            resourceDigest.tags.set([...resourceDigest.tags.value, tagInput.value]);
        }
        tagInput.set("");
    };

    const handleRemoveTag = index => {
        if (!modifiedFields.value.includes("tags")) {
            modifiedFields.set([...modifiedFields.value, "tags"]);
        }
        resourceDigest.tags.set(resourceDigest.tags.value.filter((_, i) => i !== index));
    };

    return (
        <Modal
            title={title}
            className="w-96"
            onSubmit={handleSubmit}
            onClose={PopoverState.hidePopupover}
            submitButtonText={t("editor:layout.filebrowser.fileProperties.save-changes")}
            closeButtonText={t("editor:layout.filebrowser.fileProperties.discard")}
        >
            <div className="flex flex-col items-center">
                {fileStaticResources.length === 1 && (
                    <img
                        src={resources.data[0].thumbnailURL}
                        alt={resources.data[0].key}
                        className="h-24 w-24 rounded-lg object-cover"
                    />
                )}
                <Button
                    title={t("editor:layout.filebrowser.fileProperties.regenerateThumbnail")}
                    onClick={handleRegenerateThumbnail}
                    className="mt-2 text-xs"
                >
                    {t("editor:layout.filebrowser.fileProperties.regenerateThumbnail")}
                </Button>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Typography className="text-end">
                        {t("editor:layout.filebrowser.fileProperties.name")}
                    </Typography>
                    <Typography className="text-theme-input">{filename}</Typography>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Typography className="text-end">
                        {t("editor:layout.filebrowser.fileProperties.type")}
                    </Typography>
                    <Typography className="text-theme-input">
                        {fileDigest.type.toUpperCase()}
                    </Typography>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Typography className="text-end">
                        {t("editor:layout.filebrowser.fileProperties.size")}
                    </Typography>
                    <Typography className="text-theme-input">
                        {files
                            .map(file => file.size)
                            .reduce((total, value) => total + parseInt(value ?? "0"), 0)}
                    </Typography>
                </div>
                {fileStaticResources.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <Typography className="text-end">
                                {t("editor:layout.filebrowser.fileProperties.author")}
                            </Typography>
                            <Typography className="text-theme-input">
                                {author.value?.name}
                            </Typography>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                            <Typography className="text-end">
                                {t("editor:layout.filebrowser.fileProperties.attribution")}
                            </Typography>
                            <span className="flex items-center">
                                {editedField.value === "attribution" ? (
                                    <>
                                        <Input
                                            value={resourceDigest.attribution.value ?? ""}
                                            onChange={onChange(
                                                "attribution",
                                                resourceDigest.attribution,
                                            )}
                                        />
                                        <Button
                                            title={t("common:components.save")}
                                            variant="transparent"
                                            size="small"
                                            startIcon={<RiSave2Line />}
                                            onClick={() => editedField.set(null)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Typography className="text-theme-input">
                                            {files.length > 1 &&
                                            !sharedFields.value.includes("attribution")
                                                ? t(
                                                      "editor:layout.filebrowser.fileProperties.mixedValues",
                                                  )
                                                : resourceDigest.attribution.value || (
                                                      <em>{t("common:components.none")}</em>
                                                  )}
                                        </Typography>
                                        <Button
                                            title={t("common:components.edit")}
                                            variant="transparent"
                                            size="small"
                                            startIcon={<HiPencil />}
                                            onClick={() => editedField.set("attribution")}
                                        />
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2">
                            <Typography className="text-end">
                                {t("editor:layout.filebrowser.fileProperties.licensing")}
                            </Typography>
                            <span className="flex items-center">
                                {editedField.value === "licensing" ? (
                                    <>
                                        <Input
                                            value={resourceDigest.licensing.value ?? ""}
                                            onChange={onChange(
                                                "licensing",
                                                resourceDigest.licensing,
                                            )}
                                        />
                                        <Button
                                            title={t("common:components.save")}
                                            variant="transparent"
                                            size="small"
                                            startIcon={<RiSave2Line />}
                                            onClick={() => editedField.set(null)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Typography className="text-theme-input">
                                            {files.length > 1 &&
                                            !sharedFields.value.includes("licensing")
                                                ? t(
                                                      "editor:layout.filebrowser.fileProperties.mixedValues",
                                                  )
                                                : resourceDigest.licensing.value || (
                                                      <em>{t("common:components.none")}</em>
                                                  )}
                                        </Typography>
                                        <Button
                                            title={t("common:components.edit")}
                                            variant="transparent"
                                            size="small"
                                            startIcon={<HiPencil />}
                                            onClick={() => editedField.set("licensing")}
                                        />
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="mt-10 flex flex-col gap-2">
                            <Typography className="text-theme-gray3" fontSize="sm">
                                {t("editor:layout.filebrowser.fileProperties.addTag")}
                            </Typography>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={tagInput.value}
                                    onChange={event => tagInput.set(event.target.value)}
                                    onKeyUp={event => {
                                        if (event.key === "Enter") {
                                            handleAddTag();
                                        }
                                    }}
                                />
                                <Button
                                    startIcon={<HiPlus />}
                                    title={t("editor:layout.filebrowser.fileProperties.add")}
                                    onClick={handleAddTag}
                                />
                            </div>
                            <div className="flex h-24 flex-wrap gap-2 overflow-y-auto bg-theme-surfaceInput p-2">
                                {resourceDigest.tags.value.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="flex h-fit w-fit items-center rounded bg-[#2F3137] px-2 py-0.5"
                                    >
                                        {tag}{" "}
                                        <HiXMark
                                            className="ml-1 cursor-pointer"
                                            onClick={() => handleRemoveTag(idx)}
                                        />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
