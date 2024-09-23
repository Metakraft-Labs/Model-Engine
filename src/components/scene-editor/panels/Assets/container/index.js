import { Box, Button, CircularProgress, TextField, Tooltip } from "@mui/material";
import { clone } from "lodash";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useTranslation } from "react-i18next";
import { FiRefreshCcw } from "react-icons/fi";
import { HiDotsVertical } from "react-icons/hi";
import { HiMagnifyingGlass, HiOutlineFolder, HiOutlinePlusCircle } from "react-icons/hi2";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { IoArrowBack, IoSettingsSharp } from "react-icons/io5";
import { RiAiGenerate } from "react-icons/ri";
import { toast } from "react-toastify";
import { UserStore } from "../../../../../contexts/UserStore";
import { AssetLoader } from "../../../../../engine/assets/classes/AssetLoader";
import {
    NO_PROXY,
    getMutableState,
    getState,
    useHookstate,
    useMutableState,
} from "../../../../../hyperflux";
import { ContextMenu } from "../../../../ContextMenu";
import InputGroup from "../../../../Group";
import InfiniteScroll from "../../../../InfiniteScroll";
import { Popup } from "../../../../Popup";
import Slider from "../../../../Slider";
import { AssetsPanelCategories } from "../../../assets/AssetsPanelCategories";
import { FilesViewModeSettings } from "../../../assets/FileBrowser/FileBrowserState";
import { inputFileWithAddToScene } from "../../../functions/assetFunctions";
import { EditorState } from "../../../services/EditorServices";
import { PopoverState } from "../../../services/PopoverState";
import { ClickPlacementState } from "../../../systems/ClickPlacementSystem";
import DeleteFileModal from "../../Files/browserGrid/DeleteFileModal";
import { FileIcon } from "../../Files/icon";
import { FileUploadProgress } from "../../Files/upload/FileUploadProgress";
import { AssetIconMap } from "../icons";
import MenuOption from "./MenuOption";
import TypeModal from "./TypeModal";

const ASSETS_PAGE_LIMIT = 10;

const generateParentBreadcrumbCategories = (categories, target) => {
    const findNestingCategories = (nestedCategory, parentCategory) => {
        for (const key in nestedCategory) {
            if (key === target) {
                const foundCategory = categories.find(c => c.name === parentCategory);
                if (foundCategory) {
                    return [foundCategory];
                }
                return [];
            } else if (typeof nestedCategory[key] === "object" && nestedCategory[key] !== null) {
                const nestedCategories = findNestingCategories(nestedCategory[key], key);
                if (nestedCategories.length) {
                    return [categories.find(c => c.name === parentCategory), ...nestedCategories];
                }
            }
        }
        return [];
    };

    for (const category of categories) {
        const parentCategories = findNestingCategories(category.object, category.name);
        if (parentCategories.length) {
            return parentCategories;
        }
    }

    return [];
};

function mapCategoriesHelper(collapsedCategories) {
    const result = [];
    const generateCategories = (node, depth = 0) => {
        for (const key in node) {
            const isLeaf = Object.keys(node[key]).length === 0;
            const category = {
                name: key,
                object: node[key],
                collapsed: collapsedCategories[key] ?? true,
                depth,
                isLeaf,
            };
            result.push(category);
            if (typeof node[key] === "object" && !category.collapsed) {
                generateCategories(node[key], depth + 1);
            }
        }
    };
    generateCategories(getState(AssetsPanelCategories));
    return result;
}

const ViewModeSettings = () => {
    const { t } = useTranslation();

    const viewModeSettings = useHookstate(getMutableState(FilesViewModeSettings));

    return (
        <Popup
            contentStyle={{ background: "#15171b", border: "solid", borderColor: "#5d646c" }}
            position={"bottom left"}
            trigger={
                <Tooltip title={t("editor:layout.filebrowser.view-mode.settings.name")}>
                    <Button
                        startIcon={<IoSettingsSharp />}
                        className="h-7 w-7 rounded-lg bg-[#2F3137] p-0"
                    />
                </Tooltip>
            }
        >
            <div className="flex flex-col">
                <InputGroup label={t("editor:layout.filebrowser.view-mode.settings.fontSize")}>
                    <Slider
                        min={10}
                        max={100}
                        step={0.5}
                        value={viewModeSettings.list.fontSize.value}
                        onChange={viewModeSettings.list.fontSize.set}
                        onRelease={viewModeSettings.list.fontSize.set}
                    />
                </InputGroup>
            </div>
        </Popup>
    );
};

const ResourceFile = props => {
    const { t } = useTranslation();
    const { user } = useContext(UserStore);

    const userID = user?.id;
    const { resource, selected, onClick, onChange } = props;
    const [anchorEvent, setAnchorEvent] = React.useState(undefined);

    const handleContextMenu = event => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEvent(event);
    };

    const assetType = AssetLoader.getAssetType(resource.key);
    const splitResourceKey = resource.key.split("/");
    const name = resource?.name || splitResourceKey.at(-1);
    const path = splitResourceKey.slice(0, -1).join("/") + "/";

    const [_, drag, preview] = useDrag(() => ({
        type: assetType,
        item: {
            url: resource.url,
            type: assetType,
            multiple: false,
        },
        multiple: false,
    }));

    useEffect(() => {
        if (preview) preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    return (
        <div
            key={resource.id}
            ref={drag}
            onClick={() =>
                onClick({
                    contentType: assetType,
                    name,
                    resourceUrl: resource.url,
                    size: "unknown size",
                })
            }
            onContextMenu={handleContextMenu}
            className="mb-3 flex h-auto min-w-40 cursor-pointer flex-col items-center text-center"
        >
            <span
                className={`mx-4 mb-3 mt-2 h-40 w-40 font-['Figtree'] ${
                    selected ? "rounded-lg border border-blue-primary bg-theme-studio-surface" : ""
                }`}
            >
                <FileIcon thumbnailURL={resource.thumbnailURL} type={assetType} />
            </span>

            <Tooltip title={name}>
                <span className="line-clamp-1 w-full text-wrap break-all text-sm text-[#F5F5F5]">
                    {name}
                </span>
            </Tooltip>

            <ContextMenu
                anchorEvent={anchorEvent}
                onClose={() => setAnchorEvent(undefined)}
                className="gap-1"
            >
                <div className="w-full rounded-lg bg-theme-surface-main px-4 py-2 text-sm text-white">
                    <MetadataTable
                        rows={[
                            { label: t("editor:assetMetadata.name"), value: `${name}` },
                            { label: t("editor:assetMetadata.path"), value: `${path}` },
                            {
                                label: t("editor:assetMetadata.type"),
                                value: `${resource.mimeType}`,
                            },
                            {
                                label: t("editor:assetMetadata.tags"),
                                value: `${resource.tags || "none"}`,
                            },
                        ]}
                    />
                    {!!userID && userID === resource.userId && (
                        <Button
                            variant="outline"
                            size="small"
                            fullWidth
                            onClick={() => {
                                PopoverState.showPopupover(
                                    <DeleteFileModal
                                        files={[
                                            {
                                                key: resource.key,
                                                path: resource.url,
                                                name: resource.key,
                                                fullName: name,
                                                thumbnailURL: resource.thumbnailURL,
                                                url: resource.url,
                                                type: assetType,
                                                isFolder: false,
                                            },
                                        ]}
                                        onComplete={err => {
                                            if (!err) {
                                                onChange();
                                            }
                                        }}
                                    />,
                                );
                                setAnchorEvent(undefined);
                            }}
                        >
                            {t("editor:layout.assetGrid.deleteAsset")}
                        </Button>
                    )}
                    {/* TODO: add more actions (compressing images/models, editing tags, etc) here as desired  */}
                </div>
            </ContextMenu>
        </div>
    );
};

const MetadataTable = ({ rows }) => (
    <table className="cursor-default select-text">
        <tbody>
            {rows.map((row, index) => (
                <MetadataTableRow key={index} label={row.label} value={row.value} />
            ))}
        </tbody>
    </table>
);

const MetadataTableRow = ({ label, value }) => (
    <tr>
        <td className="font-semibold">{label}</td>
        <td
            className="cursor-default select-text pl-4"
            onContextMenu={e => {
                e.stopPropagation(); // allow user to copy selected text
            }}
        >
            {value}
        </td>
    </tr>
);

function iterativelyListTags(obj) {
    const tags = [];
    for (const key in obj) {
        tags.push(key);
        if (typeof obj[key] === "object") {
            tags.push(...iterativelyListTags(obj[key]));
        }
    }
    return tags;
}

const AssetCategory = props => {
    const { categories, onClick, selectedCategory, collapsedCategories } = props.data;
    const index = props.index;
    const category = categories[index];

    const handleSelectCategory = () => {
        onClick(category);
        !category.isLeaf && collapsedCategories[category.name].set(!category.collapsed);
    };

    const handlePreview = () => {
        // TODO: add preview functionality
    };

    const fontSize = useHookstate(getMutableState(FilesViewModeSettings).list.fontSize).value;

    return (
        <Box
            sx={{
                background: selectedCategory?.name === category.name ? "#191B1F" : "#141619",
                borderRadius: "10px",
                color: selectedCategory?.name === category.name ? "blue" : "#FFFFFF",
                minHeight: category.depth === 0 ? "9rem" : "7rem",
                height: `${fontSize}px`,
                fontSize: `${fontSize}px`,
            }}
        >
            <Box
                display={"flex"}
                height={"100%"}
                width={"100%"}
                alignItems={"center"}
                gap={"2rem"}
                sx={{
                    marginLeft: category.depth > 0 ? category.depth * 16 : 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    color: "#B2B5BD",
                }}
                onClick={handleSelectCategory}
            >
                <Button
                    variant="transparent"
                    margin={0}
                    padding={0}
                    display={category.isLeaf ? "hidden" : "flex"}
                    cursor={category.isLeaf ? "auto" : "pointer"}
                    startIcon={category.collapsed ? <IoIosArrowForward /> : <IoIosArrowDown />}
                >
                    {category.collapsed ? "expand" : "collapse"}
                </Button>
                <AssetIconMap name={category.name} />
                <Box
                    display={"flex"}
                    width={"100%"}
                    alignItems={"center"}
                    gap={"1rem"}
                    sx={{
                        textWrap: "nowrap",
                        pr: "2rem",
                    }}
                >
                    <span
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "2rem",
                            textWrap: "nowrap",
                            font: "Figtree",
                            color: "#e7e7e7",
                        }}
                    >
                        {category.name}
                    </span>
                    {/* <HiEye className="flex flex-row items-center gap-2 ml-auto text-[#e7e7e7] text-sm" onClick={handlePreview} /> */}
                </Box>
            </Box>
        </Box>
    );
};

export function AssetsBreadcrumb({ parentCategories, selectedCategory, onSelectCategory }) {
    return (
        <div className="flex h-[28px] w-96 items-center gap-2 rounded-lg border border-theme-input bg-[#141619] px-2 ">
            <HiOutlineFolder className="text-xs text-[#A3A3A3]" />
            {parentCategories.map(category => (
                <span
                    key={category.name}
                    className="cursor-pointer overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-[#A3A3A3] hover:underline"
                    onClick={() => onSelectCategory(category)}
                >
                    {category.name + " > "}
                </span>
            ))}
            <span className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-[#A3A3A3]">
                {selectedCategory?.name}
            </span>
        </div>
    );
}

const CategoriesList = ({
    categories,
    selectedCategory,
    collapsedCategories,
    onSelectCategory,
    style,
}) => {
    const savedScrollPosition = useRef(0);
    const listRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = savedScrollPosition.current;
        }
    }, [categories, selectedCategory]);

    const handleScroll = () => {
        if (listRef.current) {
            savedScrollPosition.current = listRef.current.scrollTop;
        }
    };

    return (
        <div
            ref={listRef}
            className="mb-8 h-full space-y-1 overflow-x-hidden overflow-y-scroll bg-[#0E0F11] pb-8 pl-1 pr-2 pt-2"
            style={style}
            onScroll={handleScroll}
        >
            {categories.map((category, index) => (
                <AssetCategory
                    key={category.name + index}
                    data={{
                        categories: categories,
                        selectedCategory: selectedCategory,
                        onClick: category => {
                            onSelectCategory(category);
                        },
                        collapsedCategories,
                        category,
                    }}
                    index={index}
                />
            ))}
        </div>
    );
};

const AssetPanel = () => {
    const { t } = useTranslation();
    const searchTimeoutCancelRef = useRef(null);
    const collapsedCategories = useHookstate({});
    const categories = useHookstate([]);
    const selectedCategory = useHookstate(null);
    const loading = useHookstate(false);
    const searchedStaticResources = useHookstate([]);
    const searchText = useHookstate("");
    const originalPath = useMutableState(EditorState).projectName.value;
    const staticResourcesPagination = useHookstate({ total: 0, skip: 0 });
    const assetsPreviewContext = useHookstate({ selectAssetURL: "" });
    const parentCategories = useHookstate([]);
    const [openMenu, setOpenMenu] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [loadingModel, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [type, setType] = useState("");
    const [showSearch, setShowSearch] = useState(true);

    const generateAI = () => {
        setLoading(true);
        // API.instance
        //   .service(sparkPath)
        //   .create({ prompt: prompt })
        //   .then((a) => {
        //     const obj[
        //       {
        //         key: a.glbUrl,
        //         name: a.prompt,
        //         thumbnailURL: a.image,
        //         mimeType: 'application/octet-stream',
        //         tags: ['Model'],
        //         type: 'asset',
        //         updatedAt: new Date().toISOString(),
        //         createdAt: new Date().toISOString(),
        //         url: a.glbUrl,
        //         updatedBy: 'abc-123-acv-1d3',
        //         id: a.id,
        //         userId: 'abc-123-acv-1d3',
        //         hash: 'absc'
        //       }
        //     ]
        //     searchedStaticResources.merge(obj)
        //     setLoading(false)
        //   })
    };

    const mapCategories = useCallback(() => {
        categories.set(mapCategoriesHelper(collapsedCategories.value));
    }, [categories, collapsedCategories]);
    useEffect(mapCategories, [collapsedCategories]);

    useEffect(() => {
        if (!selectedCategory.value?.name) return;
        const parentCategoryBreadcrumbs = generateParentBreadcrumbCategories(
            categories.value,
            selectedCategory.value.name,
        );
        parentCategories.set(parentCategoryBreadcrumbs);
    }, [categories, selectedCategory]);

    // const staticResourcesFindApi = () => {
    //   const abortController = new AbortController()

    //   searchTimeoutCancelRef.current?.()
    //   loading.set(true)

    //   const debouncedSearchQuery = debounce(() => {
    //     const tags = selectedCategory.value
    //       ? [selectedCategory.value.name, ...iterativelyListTags(selectedCategory.value.object)]
    //       : []

    //     const query = {
    //       key: {
    //         $like: `%${searchText.value}%`
    //       },
    //       type: {
    //         $or: [{ type: 'asset' }]
    //       },
    //       tags: selectedCategory.value
    //         ? {
    //             $or: tags.flatMap((tag) => [
    //               { tags: { $like: `%${tag.toLowerCase()}%` } },
    //               { tags: { $like: `%${tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}%` } },
    //               {
    //                 tags: {
    //                   $like: `%${tag
    //                     .split(' ')
    //                     .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    //                     .join(' ')}%`
    //                 }
    //               }
    //             ])
    //           }
    //         : undefined,
    //       $sort: { mimeType: 1 },
    //       $limit: ASSETS_PAGE_LIMIT,
    //       $skip: Math.min(staticResourcesPagination.skip.value, staticResourcesPagination.total.value)
    //     }

    //     // API.instance
    //     //   .service(staticResourcePath)
    //     //   .find({ query })
    //     //   .then((resources) => {
    //     //     if (abortController.signal.aborted) return

    //     //     if (staticResourcesPagination.skip.value > 0) {
    //     //       searchedStaticResources.merge(resources.data)
    //     //     } else {
    //     //       searchedStaticResources.set(resources.data)
    //     //     }
    //     //     staticResourcesPagination.merge({ total: resources.total })
    //     //     loading.set(false)
    //     //   })
    //   }, 500)

    //   debouncedSearchQuery()
    //   searchTimeoutCancelRef.current = debouncedSearchQuery.cancel

    //   return () => {
    //     abortController.abort()
    //   }
    // }

    useEffect(() => staticResourcesPagination.skip.set(0), [searchText]);

    // useEffect(() => {
    //   const abortSignal = staticResourcesFindApi()

    //   return () => abortSignal()
    // }, [searchText, selectedCategory, staticResourcesPagination.skip])

    const ResourceItems = () => (
        <>
            {searchedStaticResources.length === 0 && (
                <div className="col-start-2 flex h-full w-full items-center justify-center text-white">
                    {t("editor:layout.scene-assets.no-search-results")}
                </div>
            )}
            {searchedStaticResources.length > 0 && (
                <>
                    {searchedStaticResources.value.map(resource => (
                        <ResourceFile
                            key={resource.id}
                            resource={resource}
                            selected={resource.url === assetsPreviewContext.selectAssetURL.value}
                            onClick={props => {
                                assetsPreviewContext.selectAssetURL.set(props.resourceUrl);
                                ClickPlacementState.setSelectedAsset(props.resourceUrl);
                            }}
                            onChange={() => staticResourcesFindApi()}
                        />
                    ))}
                </>
            )}
        </>
    );

    const handleBack = () => {
        if (!parentCategories.length) {
            selectedCategory.set(null);
            collapsedCategories.set({});
            return;
        }
        handleSelectCategory(parentCategories.get(NO_PROXY).at(-1));
    };

    const handleRefresh = () => {
        categories.set([]);
        collapsedCategories.set({});
        staticResourcesFindApi();
        mapCategories();
    };

    const handleSelectCategory = category => {
        selectedCategory.set(clone(category));
        staticResourcesPagination.skip.set(0);
        !category.isLeaf && collapsedCategories[category.name].set(!category.collapsed);
    };

    const width = useHookstate(300);
    const mouseDown = useHookstate(false);

    const handleMouseDown = event => {
        event.preventDefault();
        mouseDown.set(true);
    };

    const handleMouseUp = () => {
        mouseDown.set(false);
    };

    const handleMouseMove = event => {
        if (mouseDown.value) {
            width.set(event.pageX);
        }
    };

    return (
        <>
            <div className="mb-1 flex h-9 items-center gap-2 bg-theme-surface-main">
                <div className="ml-2"></div>
                <div className="flex h-7 w-7 items-center rounded-lg bg-[#2F3137]">
                    <Tooltip title={t("editor:layout.filebrowser.back")} className="left-1">
                        <Button
                            variant="transparent"
                            startIcon={<IoArrowBack />}
                            className="p-0"
                            onClick={handleBack}
                        />
                    </Tooltip>
                </div>

                <div className="flex h-7 w-7 items-center rounded-lg bg-[#2F3137]">
                    <Tooltip title={t("editor:layout.filebrowser.refresh")}>
                        <Button
                            variant="transparent"
                            startIcon={<FiRefreshCcw />}
                            className="p-0"
                            onClick={handleRefresh}
                        />
                    </Tooltip>
                </div>

                <ViewModeSettings />

                <div className="align-center flex h-7 w-full justify-center gap-2 sm:px-2 md:px-4 lg:px-6 xl:px-10">
                    <AssetsBreadcrumb
                        parentCategories={parentCategories.get(NO_PROXY)}
                        selectedCategory={selectedCategory.value}
                        onSelectCategory={handleSelectCategory}
                    />
                    <TextField
                        placeholder={"Search Assets"}
                        value={searchText.value}
                        onChange={e => {
                            searchText.set(e.target.value);
                        }}
                        sx={{
                            height: "7px",
                            borderRadius: "10px",
                            border: "1px solid black",
                            background: "#141619",
                            px: 2,
                            py: 0,
                            fontSize: "4px",
                            color: "#A3A3A3",
                            "&[placeholder]": {
                                color: "#A3A3A3",
                            },
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <HiMagnifyingGlass className="h-[14px] w-[14px] text-[#A3A3A3]" />
                                ),
                            },
                        }}
                    />
                </div>

                <Button
                    startIcon={<HiOutlinePlusCircle className="text-lg" />}
                    rounded="none"
                    className="h-full whitespace-nowrap bg-theme-highlight px-2"
                    size="small"
                    onClick={() =>
                        inputFileWithAddToScene({
                            projectName: originalPath,
                            directoryPath: `projects/${originalPath}/assets/`,
                        })
                            .then(handleRefresh)
                            .catch(err => {
                                toast.error(err.message);
                            })
                    }
                >
                    Upload Assets
                </Button>
                <span>
                    <Button
                        startIcon={<RiAiGenerate className="text-lg" />}
                        rounded="none"
                        className="h-full whitespace-nowrap bg-theme-highlight px-2"
                        size="small"
                        onClick={() => setOpenMenu(m => !m)}
                    >
                        Generate Assets
                    </Button>
                    {openMenu && (
                        <MenuOption
                            setType={setType}
                            setOpenMenu={setOpenMenu}
                            setOpenModal={setOpenModal}
                        />
                    )}
                </span>
            </div>
            <FileUploadProgress />
            <div
                className="flex h-full w-full"
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                <CategoriesList
                    categories={categories.value}
                    selectedCategory={selectedCategory.value}
                    collapsedCategories={collapsedCategories}
                    onSelectCategory={handleSelectCategory}
                    style={{ width: width.value }}
                />
                <div className="flex w-[20px] cursor-pointer items-center">
                    <HiDotsVertical onMouseDown={handleMouseDown} className="text-white" />
                </div>
                <div className="flex h-full w-full flex-col overflow-auto">
                    <InfiniteScroll
                        disableEvent={
                            staticResourcesPagination.skip.value >=
                                staticResourcesPagination.total.value || loading.value
                        }
                        onScrollBottom={() =>
                            staticResourcesPagination.skip.set(
                                prevSkip => prevSkip + ASSETS_PAGE_LIMIT,
                            )
                        }
                    >
                        <div className="mt-auto flex h-full w-full flex-wrap gap-2">
                            <ResourceItems />
                        </div>
                        {loading.value && (
                            <CircularProgress
                                spinnerOnly
                                size={"6rem"}
                                sx={{ height: "6px", width: "6px" }}
                            />
                        )}
                    </InfiniteScroll>
                    <div className="mx-auto mb-10" />
                </div>
                {/* <div className="w-[200px] bg-[#222222] p-2">TODO: add preview functionality</div> */}

                {openModal && (
                    <TypeModal
                        close={() => setOpenModal(false)}
                        type={type}
                        generate={generateAI}
                        search={() => {}}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        loading={loadingModel}
                        showSearch={showSearch}
                        setShowSearch={setShowSearch}
                    />
                )}
            </div>
        </>
    );
};

export default AssetPanel;
