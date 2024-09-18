import React from "react";
import { ModelFileTypes } from "../../../engine/assets/constants/fileTypes";
import { ItemTypes } from "../../scene-editor/constants/AssetTypes";
import FileBrowserInput from "../FileBrowser";

export function ModelInput({ onRelease, ...rest }) {
    return (
        <FileBrowserInput
            acceptFileTypes={ModelFileTypes}
            acceptDropItems={ItemTypes.Models}
            onRelease={onRelease}
            {...rest}
        />
    );
}

ModelInput.defaultProps = {};

export default ModelInput;
