import i18n from "i18next";

import { defineState, getMutableState, none, useMutableState } from "@ir-engine/hyperflux";

import "@ir-engine/common/src/utils/jsonUtils";

import { AuthState } from "../user/services/AuthService";
import { RethrownError } from "./errors";

const getFileKeys = files => {
    const keys = [];
    if (Array.isArray(files)) {
        files.forEach(file => {
            keys.push(file.name);
        });
    } else {
        keys.push(files.name);
    }

    return keys;
};

export const useUploadingFiles = () => {
    const fileUploadState = useMutableState(FileUploadState).value;
    const values = Object.values(fileUploadState);
    const total = values.length;
    const completed = values.reduce((prev, curr) => (curr === 1 ? prev + 1 : prev), 0);
    const sum = values.reduce((prev, curr) => prev + curr, 0);
    const progress = sum ? (sum / total) * 100 : 0;
    return { completed, total, progress };
};

export const FileUploadState = defineState({
    name: "FileUploadState",
    initial: {},

    startFileUpload: files => {
        const keys = getFileKeys(files);
        const toMerge = keys.reduce(
            (prev, curr) => ({
                ...prev,
                [curr]: 0,
            }),
            {},
        );
        getMutableState(FileUploadState).merge(toMerge);
    },

    updateFileUpload: (files, progress) => {
        const keys = getFileKeys(files);
        progress = Math.min(progress, 0.9);
        const toMerge = keys.reduce(
            (prev, curr) => ({
                ...prev,
                [curr]: progress,
            }),
            {},
        );
        getMutableState(FileUploadState).merge(toMerge);
    },

    endFileUpload: files => {
        const keys = getFileKeys(files);
        const toMerge = keys.reduce(
            (prev, curr) => ({
                ...prev,
                [curr]: none,
            }),
            {},
        );
        getMutableState(FileUploadState).merge(toMerge);
    },
});

export const uploadToFeathersService = (
    service,
    files,
    params, // todo make this type work
    onUploadProgress,
) => {
    const token = getMutableState(AuthState).authUser.accessToken.value;
    const request = new XMLHttpRequest();
    request.timeout = 10 * 60 * 1000; // 10 minutes - need to support big files on slow connections
    let aborted = false;

    FileUploadState.startFileUpload(files);

    return {
        cancel: () => {
            aborted = true;
            request.abort();
        },
        promise: new Promise((resolve, reject) => {
            request.upload.addEventListener("progress", e => {
                if (aborted) return;
                const progress = e.loaded / e.total;
                FileUploadState.updateFileUpload(files, progress);
                if (onUploadProgress) onUploadProgress(progress);
            });

            request.upload.addEventListener("error", error => {
                if (aborted) return;
                reject(new RethrownError(i18n.t("editor:errors.uploadFailed"), error));
            });

            request.addEventListener("readystatechange", e => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    FileUploadState.endFileUpload(files);
                    const status = request.status;

                    if (status === 0 || (status >= 200 && status < 400)) {
                        resolve(JSON.parse(request.responseText));
                    } else {
                        if (aborted) return;
                        console.error(
                            "Oh no! There has been an error with the request!",
                            request,
                            e,
                        );
                        if (status === 403) {
                            const errorResponse = JSON.parse(request.responseText);
                            reject(new Error(errorResponse.message));
                        } else {
                            reject();
                        }
                    }
                }
            });

            const formData = new FormData();
            Object.entries(params).forEach(([key, val]) => {
                formData.set(key, typeof val === "object" ? JSON.stringify(val) : val);
            });

            if (Array.isArray(files)) {
                files.forEach(file => {
                    formData.append("media[]", file);
                });
            } else {
                formData.set("media", files);
            }

            request.open("post", `${process.env.API_URL}/${service}`, true);
            request.setRequestHeader("Authorization", `Bearer ${token}`);
            request.send(formData);
        }),
    };
};

/**
 * matchesFileTypes function used to match file type with existing file types.
 *
 * @param file      [object contains file data]
 * @param fileTypes [Array contains existing file types]
 */

export function matchesFileTypes(file, fileTypes) {
    for (const pattern of fileTypes) {
        if (pattern.startsWith(".")) {
            if (file.name.toLowerCase().endsWith(pattern)) {
                return true;
            }
        } else if (file.type.startsWith(pattern)) {
            return true;
        }
    }
    return false;
}
