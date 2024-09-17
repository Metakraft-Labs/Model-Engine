import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import { Vector3 } from "three";

import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { SupportedFileTypes } from "../../../constants/AssetTypes";
import { addMediaNode } from "../functions/addMediaNode";
import { getCursorSpawnPosition } from "../functions/screenSpaceFunctions";
import useUpload from "./useUpload";

const dropZoneBackgroundStyle = {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
};

const h3Style = {
    fontSize: "1.5em",
    marginTop: "12px",
    fontWeight: "normal",
};

export function AssetDropZone() {
    const { t } = useTranslation();

    const onUpload = useUpload();

    const [{ canDrop, isOver, isDragging, isUploaded }, onDropTarget] = useDrop({
        accept: [...SupportedFileTypes],
        drop(item, monitor) {
            const mousePos = monitor.getClientOffset();

            if (item.files) {
                // When user drags files from her file system
                const entries = Array.from(item.items).map(item => item.webkitGetAsEntry());

                onUpload(entries).then(assets => {
                    if (!assets) return;

                    assets.map(asset => {
                        const vec3 = new Vector3();
                        getCursorSpawnPosition(mousePos, vec3);
                        addMediaNode(asset, undefined, undefined, [
                            { name: TransformComponent.jsonID, props: { position: vec3 } },
                        ]);
                    });
                });
            } else {
                // When user drags files from files panel
                const vec3 = new Vector3();
                getCursorSpawnPosition(mousePos, vec3);
                addMediaNode(item.url, undefined, undefined, [
                    { name: TransformComponent.jsonID, props: { position: vec3 } },
                ]);
            }
        },
        collect: monitor => ({
            canDrop: monitor.canDrop(),
            isOver: monitor.isOver(),
            isDragging: monitor.getItem() !== null && monitor.canDrop(),
            isUploaded: !monitor.getItem()?.files,
        }),
    });

    //returning dropzone view
    return (
        <div
            ref={onDropTarget}
            style={{
                ...dropZoneBackgroundStyle,
                opacity: isOver && canDrop && !isUploaded ? "1" : "0",
                pointerEvents: isDragging ? "auto" : "none",
            }}
        >
            <CloudUploadIcon fontSize="large" />
            <h3 style={h3Style}>{t("editor:asset.dropZone.title")}</h3>
        </div>
    );
}

export default AssetDropZone;
