import { useCallback } from "react";

import { AllFileTypes } from "../../../engine/assets/constants/fileTypes";
import { getState } from "../../../hyperflux";

import { getEntries, uploadProjectAssetsFromUpload } from "../functions/assetFunctions";
import { EditorState } from "../services/EditorServices";

/**@deprecated throws error on the server - to be replaced with newer ui implementation */
export default function useUpload(options = {}) {
    const multiple = !!options.multiple;
    const accepts = options.accepts || AllFileTypes;

    const validateEntry = async item => {
        if (item.isDirectory) {
            let directoryReader = item.createReader();
            const entries = await getEntries(directoryReader);
            for (let index = 0; index < entries.length; index++) {
                await validateEntry(entries[index]);
            }
        }

        if (item.isFile) {
            let accepted = false;
            for (const pattern of accepts) {
                if (item.name.toLowerCase().endsWith(pattern)) {
                    accepted = true;
                    break;
                }
            }
            if (!accepted) {
                throw new Error(
                    `Mime type error for ${item.name}. Accepted types: ${accepts.join(", ")}`,
                );
            }
        }
    };

    const onUpload = useCallback(
        //initailizing files by using assets files after upload.
        async entries => {
            try {
                //check if not multiple and files contains length greator
                if (!multiple && entries.length > 1) {
                    throw new Error("Multiple file error occurred");
                }

                //check if assets is not empty.
                if (accepts) {
                    for (let index = 0; index < entries.length; index++) {
                        await validateEntry(entries[index]);
                    }
                }
                const { projectName } = getState(EditorState);
                const assets = await uploadProjectAssetsFromUpload(projectName, entries);
                const result = await Promise.all(assets.promises);
                return result.flat();
            } catch (error) {
                console.error(error, "Error on upload");
                return null;
            }
        },
        [multiple, accepts],
    );
    return onUpload;
}
