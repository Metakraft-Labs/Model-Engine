import React from "react";
import { useTranslation } from "react-i18next";

import { Typography } from "@mui/material";
import { imageConvertPath } from "../../../../../common/src/schema.type.module";
import { ImageConvertDefaultParms } from "../../../../../engine/assets/constants/ImageConvertParms";
import { useHookstate } from "../../../../../hyperflux";
import { useMutation } from "../../../../../spatial/common/functions/FeathersHooks";
import Checkbox from "../../../../Checkbox";
import Label from "../../../../Label";
import Modal from "../../../../Modal/Modal2";
import Select from "../../../../Select";
import NumericInput from "../../../../inputs/Numeric";
import { PopoverState } from "../../../services/PopoverState";

export default function ImageConvertModal({ file, refreshDirectory }) {
    const { t } = useTranslation();
    const modalProcessing = useHookstate(false);

    const convertProperties = useHookstate(ImageConvertDefaultParms);
    const imageConvertMutation = useMutation(imageConvertPath);

    const handleSubmit = async () => {
        convertProperties.src.set(file.isFolder ? `${file.url}/${file.key}` : file.url);
        imageConvertMutation
            .create({
                ...convertProperties.value,
            })
            .then(() => {
                refreshDirectory();
                PopoverState.hidePopupover();
            });
    };

    return (
        <Modal
            title={t("editor:layout.filebrowser.convert")}
            className="w-[50vw] max-w-2xl"
            onSubmit={handleSubmit}
            onClose={PopoverState.hidePopupover}
            submitLoading={modalProcessing.value}
        >
            <div className="ml-32 flex flex-col gap-4">
                <Typography fontWeight="semibold">
                    {file.name}{" "}
                    {file.isFolder
                        ? t("editor:layout.filebrowser.directory")
                        : t("editor:layout.filebrowser.file")}
                </Typography>
                <div className="flex items-center gap-2">
                    <Label className="w-16">
                        {t("editor:layout.filebrowser.image-convert.format")}
                    </Label>
                    <Select
                        inputClassName="px-2 py-0.5 text-theme-input text-sm"
                        options={[
                            { label: "PNG", value: "png" },
                            { label: "JPG", value: "jpg" },
                            { label: "WEBP", value: "webp" },
                        ]}
                        currentValue={convertProperties.format.value}
                        onChange={value => convertProperties.format.set(value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="w-16">
                        {t("editor:layout.filebrowser.image-convert.resize")}
                    </Label>
                    <Checkbox
                        className="bg-theme-highlight"
                        value={convertProperties.resize.value}
                        onChange={value => convertProperties.resize.set(value)}
                    />
                </div>
                {convertProperties.resize.value && (
                    <>
                        <div className="flex items-center gap-2">
                            <Label className="w-16">
                                {t("editor:layout.filebrowser.image-convert.width")}
                            </Label>
                            <NumericInput
                                className="w-52 bg-[#141619] px-2 py-0.5"
                                value={convertProperties.width.value}
                                onChange={value => convertProperties.width.set(value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="w-16">
                                {t("editor:layout.filebrowser.image-convert.height")}
                            </Label>
                            <NumericInput
                                className="w-52 bg-[#141619] px-2 py-0.5"
                                value={convertProperties.height.value}
                                onChange={value => convertProperties.height.set(value)}
                            />
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
