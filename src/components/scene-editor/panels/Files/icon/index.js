import React from "react";
//import styles from '../styles.module.scss'
import { HiFolder } from "react-icons/hi2";
import { IoAccessibilityOutline } from "react-icons/io5";

import {
    MdOutlineAudioFile,
    MdOutlinePhotoSizeSelectActual,
    MdOutlineViewInAr,
} from "react-icons/md";
import { PiVideoCameraBold } from "react-icons/pi";
import { TbFileDescription } from "react-icons/tb";

const FileIconType = {
    gltf: MdOutlineViewInAr,
    "gltf-binary": MdOutlineViewInAr,
    glb: MdOutlineViewInAr,
    vrm: IoAccessibilityOutline,
    usdz: MdOutlineViewInAr,
    fbx: MdOutlineViewInAr,
    png: MdOutlinePhotoSizeSelectActual,
    jpeg: MdOutlinePhotoSizeSelectActual,
    jpg: MdOutlinePhotoSizeSelectActual,
    ktx2: MdOutlinePhotoSizeSelectActual,
    m3u8: PiVideoCameraBold,
    mp4: PiVideoCameraBold,
    mpeg: MdOutlineAudioFile,
    mp3: MdOutlineAudioFile,
    "model/gltf-binary": MdOutlineViewInAr,
    "model/gltf": MdOutlineViewInAr,
    "model/glb": MdOutlineViewInAr,
    "model/vrm": IoAccessibilityOutline,
    "model/usdz": MdOutlineViewInAr,
    "model/fbx": MdOutlineViewInAr,
    "image/png": MdOutlinePhotoSizeSelectActual,
    "image/jpeg": MdOutlinePhotoSizeSelectActual,
    "image/jpg": MdOutlinePhotoSizeSelectActual,
    "application/pdf": null,
    "application/vnd.apple.mpegurl": PiVideoCameraBold,
    "video/mp4": PiVideoCameraBold,
    "audio/mpeg": MdOutlineAudioFile,
    "audio/mp3": MdOutlineAudioFile,
};

export const FileIcon = ({
    thumbnailURL,
    type,
    isFolder,
    color = "text-white",
    isMinified = false,
}) => {
    const FallbackIcon = FileIconType[type ?? ""];

    return (
        <>
            {isFolder ? (
                <HiFolder className={`${color}`} />
            ) : thumbnailURL ? (
                <img
                    className={`${isMinified ? "h-4 w-4" : "h-full w-full"} object-contain`}
                    crossOrigin="anonymous"
                    src={thumbnailURL}
                    alt=""
                />
            ) : FallbackIcon ? (
                <FallbackIcon className={`${color} h-full w-full p-4`} />
            ) : (
                <>
                    <TbFileDescription className={`${color}`} />
                    {/* type && type.length > 0 && showRibbon && <span className='text-xs'>{type}</span> */}
                </>
            )}
        </>
    );
};
