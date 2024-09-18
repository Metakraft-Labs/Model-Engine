import React from "react";
import { AllFileTypes } from "../../../engine/assets/constants/fileTypes";
import { ItemTypes } from "../../scene-editor/constants/AssetTypes";
import FileBrowserInput from "../FileBrowser";

export function FolderInput({ ...rest }) {
    return (
        <FileBrowserInput
            acceptFileTypes={AllFileTypes}
            acceptDropItems={[ItemTypes.Folder]}
            {...rest}
        />
    );
}

FolderInput.defaultProps = {};

export default FolderInput;
