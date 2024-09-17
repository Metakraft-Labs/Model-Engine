import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { archiverPath } from "../../../../../common/src/schema.type.module";
import { bytesToSize } from "../../../../../common/src/utils/btyesToSize";
import { defineState, getMutableState, useMutableState } from "../../../../../hyperflux";
import Progress from "../../../../Progress";
import { downloadBlobAsZip } from "../../../functions/assetFunctions";

const DownloadProjectState = defineState({
    name: "DownloadProjectState",
    initial: () => ({
        total: 0,
        progress: 0,
        isDownloading: false,
    }),
});

export const handleDownloadProject = async (projectName, selectedDirectory) => {
    const data = await {}?.instance
        ?.service(archiverPath)
        .get(null, { query: { project: projectName } })
        .catch(err => {
            toast.warn(err.message);
            return null;
        });
    if (!data) return;

    const downloadState = getMutableState(DownloadProjectState);

    downloadState.isDownloading.set(true); // Start Download

    const response = await fetch(`${process.env.REACT_APP_S3_ASSETS}/editor/${data}`);
    const totalBytes = parseInt(response.headers.get("Content-Length") || "0", 10);
    downloadState.total.set(totalBytes); // Set the total bytes

    const reader = response.body?.getReader();
    const chunks = [];
    let bytesReceived = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        bytesReceived += value.length;
        downloadState.progress.set(bytesReceived);
    }

    const blob = new Blob(chunks);
    downloadState.isDownloading.set(false); // Mark as completed
    downloadState.progress.set(0);
    downloadState.total.set(0);

    let fileName;
    if (selectedDirectory.at(-1) === "/") {
        fileName = selectedDirectory.split("/").at(-2);
    } else {
        fileName = selectedDirectory.split("/").at(-1);
    }

    downloadBlobAsZip(blob, fileName);
};

export const ProjectDownloadProgress = () => {
    const { t } = useTranslation();
    const downloadState = useMutableState(DownloadProjectState);
    const isDownloading = downloadState.isDownloading.value;
    const completed = bytesToSize(downloadState.progress.value);
    const total = bytesToSize(downloadState.total.value);
    const progress = (downloadState.progress.value / downloadState.total.value) * 100;

    return isDownloading ? (
        <div className="flex h-auto w-full justify-center pb-2 pt-2">
            <div className="flex w-1/2">
                <span className="inline-block pr-2 text-xs font-normal leading-none text-theme-primary">
                    {t("editor:layout.filebrowser.downloadingProject", { completed, total })}
                </span>
                <div className="basis-1/2">
                    <Progress value={progress} />
                </div>
            </div>
        </div>
    ) : null;
};
