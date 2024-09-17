import React from "react";
import { useTranslation } from "react-i18next";
import Progress from "../../../../Progress";
import { useUploadingFiles } from "../../../util/upload";

export const FileUploadProgress = () => {
    const { t } = useTranslation();
    const { completed, total, progress } = useUploadingFiles();

    return total ? (
        <div className="flex h-auto w-full justify-center pb-2 pt-2">
            <div className="flex w-1/2">
                <span className="inline-block pr-2 text-xs font-normal leading-none text-theme-primary">
                    {t("editor:layout.filebrowser.uploadingFiles", { completed, total })}
                </span>
                <div className="basis-1/2">
                    <Progress value={progress} />
                </div>
            </div>
        </div>
    ) : null;
};
