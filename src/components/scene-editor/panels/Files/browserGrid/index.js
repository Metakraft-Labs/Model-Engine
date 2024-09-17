import { Tooltip } from "@mui/material";
import React, { useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import { IoIosArrowForward } from "react-icons/io";
import { VscBlank } from "react-icons/vsc";
import { twMerge } from "tailwind-merge";
import { Vector3 } from "three";
import { fileBrowserPath } from "../../../../../common/src/schema.type.module";
import { CommonKnownContentTypes } from "../../../../../common/src/utils/CommonKnownContentTypes";
import { SupportedFileTypes } from "../../../../../constants/AssetTypes";
import { getMutableState, useHookstate } from "../../../../../hyperflux";
import { useMutation } from "../../../../../spatial/common/functions/FeathersHooks";
import { TransformComponent } from "../../../../../spatial/transform/components/TransformComponent";
import Button from "../../../../Button";
import { ContextMenu } from "../../../../ContextMenu";
import {
    FilesViewModeSettings,
    availableTableColumns,
} from "../../../assets/FileBrowser/FileBrowserState";
import { addMediaNode } from "../../../functions/addMediaNode";
import { getSpawnPositionAtCenter } from "../../../functions/screenSpaceFunctions";
import { PopoverState } from "../../../services/PopoverState";
import { FileIcon } from "../icon";
import ImageConvertModal from "./ImageConvertModal";
import RenameFileModal from "./RenameFileModal";

export const canDropItemOverFolder = folderName =>
    folderName.endsWith("/assets") ||
    folderName.indexOf("/assets/") !== -1 ||
    folderName.endsWith("/public") ||
    folderName.indexOf("/public/") !== -1;

/**
 * if `wrap` is enabled, wraps the `children` inside a `TableBody` with Table Heading and Table Component attached
 */
export const FileTableWrapper = ({ wrap, children }) => {
    if (!wrap) {
        return children;
    }
    const { t } = useTranslation();
    const selectedTableColumns = useHookstate(
        getMutableState(FilesViewModeSettings).list.selectedTableColumns,
    ).value;
    return (
        <div className="table-container">
            <table className="w-full">
                <thead>
                    <tr className="table-header-row h-8 text-left text-[#E7E7E7]">
                        {availableTableColumns
                            .filter(header => selectedTableColumns[header])
                            .map(header => (
                                <th
                                    key={header}
                                    className="table-cell text-xs font-normal dark:text-[#A3A3A3]"
                                >
                                    {t(`editor:layout.filebrowser.table-list.headers.${header}`)}
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
};

export const FileTableListBody = ({
    file,
    onContextMenu,
    onClick,
    onDoubleClick,
    modifiedDate,
    drop,
    isOver,
    drag,
    projectName,
}) => {
    const selectedTableColumns = useHookstate(
        getMutableState(FilesViewModeSettings).list.selectedTableColumns,
    ).value;
    const fontSize = useHookstate(getMutableState(FilesViewModeSettings).list.fontSize).value;
    const dragFn = drag ?? (input => input);
    const dropFn = drop ?? (input => input);

    const thumbnailURL = file.thumbnailURL;

    const tableColumns = {
        name: (
            <span
                className="flex h-7 max-h-7 flex-row items-center gap-2 font-['Figtree'] text-[#e7e7e7]"
                style={{ fontSize: `${fontSize}px` }}
            >
                {file.isFolder ? <IoIosArrowForward /> : <VscBlank />}
                <FileIcon
                    isMinified={true}
                    thumbnailURL={thumbnailURL}
                    type={file.type}
                    isFolder={file.isFolder}
                />
                {file.fullName}
            </span>
        ),
        type: file.type.toUpperCase(),
        dateModified: modifiedDate || "",
        size: file.size,
    };
    return (
        <tr
            key={file.key}
            className={`h-9 text-[#a3a3a3] hover:bg-[#191B1F]`}
            onContextMenu={onContextMenu}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            ref={ref => dragFn(dropFn(ref))}
        >
            {availableTableColumns
                .filter(header => selectedTableColumns[header])
                .map((header, idx) => (
                    <td key={idx} style={{ fontSize: `${fontSize}px` }}>
                        {tableColumns[header]}
                    </td>
                ))}
        </tr>
    );
};

export const FileGridItem = props => {
    const iconSize = useHookstate(getMutableState(FilesViewModeSettings).icons.iconSize).value;
    const thumbnailURL = props.item.thumbnailURL;
    const { t } = useTranslation();

    return (
        <div
            className={`flex h-auto max-h-32 w-28 cursor-pointer flex-col items-center text-center ${
                props.isSelected ? "rounded bg-[#191B1F]" : ""
            }`}
            onDoubleClick={props.item.isFolder ? props.onDoubleClick : undefined}
            onClick={props.onClick}
        >
            <div
                className="mx-4 mt-2 font-['Figtree']"
                style={{
                    height: iconSize,
                    width: iconSize,
                    fontSize: iconSize,
                }}
            >
                <FileIcon
                    thumbnailURL={thumbnailURL}
                    type={props.item.type}
                    isFolder={props.item.isFolder}
                    color="text-[#375DAF]"
                />
            </div>

            <Tooltip title={t(props.item.fullName)}>
                <div className="text-secondary line-clamp-1 w-full text-wrap break-all text-sm">
                    {props.item.fullName}
                </div>
            </Tooltip>
        </div>
    );
};

function fileConsistsOfContentType(file, contentType) {
    if (file.isFolder) {
        return contentType.startsWith("image");
    } else {
        const guessedType = CommonKnownContentTypes[file.type];
        return guessedType?.startsWith(contentType);
    }
}

export function FileBrowserItem({
    item,
    disableDnD,
    currentContent,
    projectName,
    onClick,
    onContextMenu,
    handleDropItemsOnPanel,
    openModelCompress,
    openImageCompress,
    openFileProperties,
    openDeleteFileModal,
    isFilesLoading,
    addFolder,
    isListView,
    staticResourceModifiedDates,
    isSelected,
    refreshDirectory,
    selectedFileKeys,
}) {
    const { t } = useTranslation();
    const [anchorEvent, setAnchorEvent] = React.useState(undefined);

    const fileService = useMutation(fileBrowserPath);
    const handleContextMenu = event => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEvent(event);
        onContextMenu(event, item);
    };

    const handleClose = () => {
        setAnchorEvent(undefined);
    };

    const onClickItem = e => onClick(e, item);

    const placeObjectAtOrigin = () => {
        addMediaNode(item.url);
        handleClose();
    };

    const placeObject = async () => {
        const vec3 = new Vector3();
        getSpawnPositionAtCenter(vec3);
        addMediaNode(item.url, undefined, undefined, [
            { name: TransformComponent.jsonID, props: { position: vec3 } },
        ]);
        handleClose();
    };

    const copyURL = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(item.url);
        }
        handleClose();
    };

    const openURL = () => {
        window.open(item.url);
        handleClose();
    };

    const Copy = () => {
        currentContent.current = { item: item, isCopy: true };
        handleClose();
    };

    const Cut = () => {
        currentContent.current = { item: item, isCopy: false };
        handleClose();
    };

    const pasteContent = async () => {
        handleClose();
        if (isFilesLoading) return;

        fileService.update(null, {
            oldProject: projectName,
            newProject: projectName,
            oldName: currentContent.current.item.fullName,
            newName: currentContent.current.item.fullName,
            oldPath: currentContent.current.item.path,
            newPath: item.isFolder ? item.path + item.fullName : item.path,
            isCopy: currentContent.current.isCopy,
        });
    };

    const [_dragProps, drag, preview] = disableDnD
        ? [undefined, undefined, undefined]
        : useDrag(() => ({
              type: item.type,
              item,
              multiple: false,
          }));

    const [{ isOver }, drop] = disableDnD
        ? [{ isOver: false }, undefined]
        : useDrop({
              accept: [...SupportedFileTypes],
              drop: dropItem => handleDropItemsOnPanel(dropItem, item),
              canDrop: dropItem =>
                  item.isFolder &&
                  ("key" in dropItem || canDropItemOverFolder(item.key)) &&
                  !selectedFileKeys.includes(item.key),
              collect: monitor => ({
                  isOver: monitor.canDrop() && monitor.isOver(),
              }),
          });

    useEffect(() => {
        if (preview) preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    return (
        <>
            {isListView ? (
                <FileTableListBody
                    file={item}
                    onContextMenu={handleContextMenu}
                    onClick={onClickItem}
                    onDoubleClick={onClickItem}
                    modifiedDate={staticResourceModifiedDates[item.key]}
                    drop={drop}
                    isOver={isOver}
                    drag={drag}
                    projectName={projectName}
                />
            ) : (
                <div ref={drop} className={twMerge("h-min", isOver && "border-2 border-gray-400")}>
                    <div ref={drag}>
                        <div onContextMenu={handleContextMenu}>
                            <FileGridItem
                                item={item}
                                onClick={onClickItem}
                                onDoubleClick={onClickItem}
                                isSelected={isSelected}
                                projectName={projectName}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ContextMenu anchorEvent={anchorEvent} onClose={handleClose}>
                <div className="flex w-fit min-w-44 flex-col gap-1 truncate rounded-lg bg-neutral-900 shadow-lg">
                    <Button variant="outline" size="small" fullWidth onClick={addFolder}>
                        {t("editor:layout.filebrowser.addNewFolder")}
                    </Button>
                    {!item.isFolder && (
                        <Button variant="outline" size="small" fullWidth onClick={placeObject}>
                            {t("editor:layout.assetGrid.placeObject")}
                        </Button>
                    )}
                    {!item.isFolder && (
                        <Button
                            variant="outline"
                            size="small"
                            fullWidth
                            onClick={placeObjectAtOrigin}
                        >
                            {t("editor:layout.assetGrid.placeObjectAtOrigin")}
                        </Button>
                    )}
                    {!item.isFolder && (
                        <Button variant="outline" size="small" fullWidth onClick={openURL}>
                            {t("editor:layout.assetGrid.openInNewTab")}
                        </Button>
                    )}
                    <Button variant="outline" size="small" fullWidth onClick={copyURL}>
                        {t("editor:layout.assetGrid.copyURL")}
                    </Button>
                    <Button variant="outline" size="small" fullWidth onClick={Cut}>
                        {t("editor:layout.filebrowser.cutAsset")}
                    </Button>
                    <Button variant="outline" size="small" fullWidth onClick={Copy}>
                        {t("editor:layout.filebrowser.copyAsset")}
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        fullWidth
                        disabled={!currentContent.current}
                        onClick={pasteContent}
                    >
                        {t("editor:layout.filebrowser.pasteAsset")}
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        fullWidth
                        onClick={() => {
                            PopoverState.showPopupover(
                                <RenameFileModal projectName={projectName} file={item} />,
                            );
                            handleClose();
                        }}
                    >
                        {t("editor:layout.filebrowser.renameAsset")}
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        fullWidth
                        onClick={() => {
                            openDeleteFileModal();
                            handleClose();
                        }}
                    >
                        {t("editor:layout.assetGrid.deleteAsset")}
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        fullWidth
                        onClick={() => {
                            openFileProperties(item);
                            handleClose();
                        }}
                    >
                        {t("editor:layout.filebrowser.viewAssetProperties")}
                    </Button>
                    {/*
          <Button
            variant="outline"
            size="small"
            fullWidth
            disabled={!fileConsistsOfContentType(item, 'model') && !fileConsistsOfContentType(item, 'image')}
            onClick={() => {
              if (fileConsistsOfContentType(item, 'model')) {
                PopoverState.showPopupover(
                  <ModelCompressionPanel selectedFile={item as FileType} refreshDirectory={refreshDirectory} />
                )
              } else if (fileConsistsOfContentType(item, 'image')) {
                PopoverState.showPopupover(
                  <ImageCompressionPanel selectedFile={item as FileType} refreshDirectory={refreshDirectory} />
                )
              }
              handleClose()
            }}
          >
            {t('editor:layout.filebrowser.compress')}
          </Button>
          */}

                    {fileConsistsOfContentType(item, "model") && (
                        <Button
                            variant="outline"
                            size="small"
                            fullWidth
                            // disabled={!fileConsistsOfContentType(item, 'model') && !fileConsistsOfContentType(item, 'image')} // TODO: move context menu to its own component, with a State<Filetype[]> -JS
                            onClick={() => {
                                openModelCompress();
                                handleClose();
                            }}
                        >
                            {t("editor:layout.filebrowser.compress")}
                        </Button>
                    )}

                    {fileConsistsOfContentType(item, "image") && (
                        <Button
                            variant="outline"
                            size="small"
                            fullWidth
                            // disabled={!fileConsistsOfContentType(item, 'model') && !fileConsistsOfContentType(item, 'image')} // TODO: move context menu to its own component, with a State<Filetype[]> -JS
                            onClick={() => {
                                openImageCompress();
                                handleClose();
                            }}
                        >
                            {t("editor:layout.filebrowser.compress")}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="small"
                        fullWidth
                        onClick={() => {
                            PopoverState.showPopupover(
                                <ImageConvertModal
                                    file={item}
                                    refreshDirectory={refreshDirectory}
                                />,
                            );
                            handleClose();
                        }}
                        disabled={!(["jpg", "png", "webp"].includes(item.type) || item.isFolder)}
                    >
                        {t("editor:layout.filebrowser.convert")}
                    </Button>
                </div>
            </ContextMenu>
        </>
    );
}
