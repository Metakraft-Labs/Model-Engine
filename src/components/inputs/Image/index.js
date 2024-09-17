import React from "react";
import { ImageFileTypes } from "../../../engine/assets/constants/fileTypes";
import { ItemTypes } from "../../scene-editor/constants/AssetTypes";
import FileBrowserInput from "../FileBrowser";

export function ImageInput({ ...rest }) {
    return (
        <FileBrowserInput
            acceptFileTypes={ImageFileTypes}
            acceptDropItems={ItemTypes.Images}
            {...rest}
        />
    );
}

export default ImageInput;
