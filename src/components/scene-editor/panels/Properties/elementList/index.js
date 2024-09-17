import { startCase } from "lodash";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getState, useHookstate, useMutableState } from "../../../../../hyperflux";

import { Typography } from "@mui/material";
import { GrStatusPlaceholder } from "react-icons/gr";
import { IoMdAddCircle } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import Button from "../../../../Button";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { addMediaNode } from "../../../functions/addMediaNode";
import { PrefabIcons, PrefabShelfState } from "../../../prefabs/PrefabEditors";
import { ComponentEditorsState } from "../../../services/ComponentEditors";
import { ComponentShelfCategoriesState } from "../../../services/ComponentShelfCategoriesState";
import { SelectionState } from "../../../services/SelectionServices";

const ComponentListItem = ({ item, onSelect }) => {
    const { t } = useTranslation();
    useMutableState(ComponentEditorsState).keys; // ensure reactively updates new components
    const Icon = getState(ComponentEditorsState)[item.name]?.iconComponent ?? GrStatusPlaceholder;

    // remove any prefix from the jsonID
    const jsonName = item.jsonID?.split("_").slice(1).join("-") || item.name;

    return (
        <Button
            variant="transparent"
            fullWidth
            className="w-full bg-theme-primary p-2 text-[#B2B5BD]"
            onClick={() => {
                const entities = SelectionState.getSelectedEntities();
                EditorControlFunctions.addOrRemoveComponent(entities, item, true);
                onSelect();
            }}
            startIcon={<Icon className="h-4 w-4 text-[#B2B5BD]" />}
        >
            <div className="ml-4 w-full">
                <Typography className="mb-1 block text-left text-sm text-[#B2B5BD]">
                    {startCase(jsonName.replace("-", " ").toLowerCase())}
                </Typography>
                <Typography component="p" className="block text-left text-xs text-theme-secondary">
                    {t(`editor:layout.assetGrid.component-detail.${jsonName}`, "")}
                </Typography>
            </div>
        </Button>
    );
};

const PrefabListItem = ({ item, onSelect }) => {
    return (
        <Button
            variant="transparent"
            fullWidth
            className="w-full bg-theme-primary p-2 text-[#B2B5BD]"
            onClick={() => {
                const url = item.url;
                if (!url.length) {
                    EditorControlFunctions.createObjectFromSceneElement();
                } else {
                    addMediaNode(url);
                }
                onSelect();
            }}
            startIcon={<IoMdAddCircle className="h-4 w-4 text-[#B2B5BD]" />}
        >
            <div className="ml-4 w-full">
                <Typography className="mb-1 block text-left text-sm text-[#B2B5BD]">
                    {item.name}
                </Typography>
                <Typography component="p" className="block text-left text-xs text-theme-secondary">
                    {item.detail}
                </Typography>
            </div>
        </Button>
    );
};

const SceneElementListItem = ({ categoryTitle, selected, onClick }) => {
    const icon = PrefabIcons[categoryTitle] || PrefabIcons.default;

    return (
        <button
            className={twMerge(
                "place-items-center gap-1 rounded-xl border-[1px] border-[#212226] bg-theme-primary px-3 py-2.5 text-sm font-medium",
                selected ? "text-primary border-[#42454D] bg-[#212226]" : "text-[#B2B5BD]",
            )}
            onClick={onClick}
        >
            <div className="flex flex-col items-center justify-center">
                {icon}
                <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {categoryTitle}
                </div>
            </div>
        </button>
    );
};

const useComponentShelfCategories = search => {
    useMutableState(ComponentShelfCategoriesState).value;

    if (!search) {
        return Object.entries(getState(ComponentShelfCategoriesState)).filter(
            ([_, items]) => !!items.length,
        );
    }

    const searchString = search.toLowerCase();

    return Object.entries(getState(ComponentShelfCategoriesState))
        .map(([category, items]) => {
            const filteredItems = items.filter(item =>
                item.name.toLowerCase().includes(searchString),
            );
            return [category, filteredItems];
        })
        .filter(([_, items]) => !!items.length);
};

const usePrefabShelfCategories = search => {
    const prefabState = useMutableState(PrefabShelfState).value;
    const prefabShelves = useMemo(() => {
        const shelves = {};
        for (const prefab of prefabState) {
            shelves[prefab.category] ??= [];
            shelves[prefab.category].push(prefab);
        }
        return shelves;
    }, [prefabState]);

    if (!search) {
        return Object.entries(prefabShelves);
    }

    const searchString = search.toLowerCase();

    return Object.entries(prefabShelves)
        .map(([category, items]) => {
            const filteredItems = items.filter(item =>
                item.name.toLowerCase().includes(searchString),
            );
            return [category, filteredItems];
        })
        .filter(([_, items]) => !!items.length);
};

export function ElementList({ type, onSelect }) {
    const { t } = useTranslation();
    const search = useHookstate({ local: "", query: "" });
    const searchTimeout = useRef(null);
    const selectedCategories = useHookstate([]);
    const isInSearchMode = useHookstate(false);
    const prevSearchQuery = useRef("");

    const onClickCategory = index => {
        const currentIndex = selectedCategories.value.indexOf(index);
        if (currentIndex === -1) {
            selectedCategories.set([...selectedCategories.value, index]);
        } else {
            const newSelectedCategories = [...selectedCategories.value];
            newSelectedCategories.splice(currentIndex, 1);
            selectedCategories.set(newSelectedCategories);
        }
    };

    const shelves =
        type === "components"
            ? useComponentShelfCategories(search.query.value)
            : usePrefabShelfCategories(search.query.value);
    const inputReference = useRef < HTMLInputElement > null;

    const allCategories = useMemo(() => {
        return Array.from({ length: shelves.length }, (_, index) => index);
    }, [shelves]);

    useEffect(() => {
        inputReference.current?.focus();
    }, []);

    useEffect(() => {
        if (!search.query.value) {
            isInSearchMode.set(false);
            if (prevSearchQuery.current) {
                selectedCategories.set([]);
            }
        } else {
            isInSearchMode.set(true);
            selectedCategories.set(allCategories);
        }
        prevSearchQuery.current = search.query.value;
    }, [search.query, allCategories]);

    const onSearch = text => {
        search.local.set(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            search.query.set(text);
        }, 50);
    };

    return (
        <div className="rounded-xl bg-theme-primary p-4">
            <div className="h-auto w-full overflow-x-hidden overflow-y-scroll  p-2">
                <Typography className="mb-1.5 w-full text-center uppercase text-white">
                    {t(`editor:layout.assetGrid.${type}`)}
                </Typography>
                <TypographyField
                    placeholder={t(`editor:layout.assetGrid.${type}-search`)}
                    value={search.local.value}
                    onChange={val => onSearch(val)}
                    ref={inputReference}
                />
            </div>

            {!isInSearchMode.value && (
                <div className="grid grid-cols-4 gap-1">
                    {shelves.map(([category, _items], index) => (
                        <SceneElementListItem
                            key={category}
                            categoryTitle={category}
                            onClick={() => onClickCategory(index)}
                            selected={selectedCategories.value.includes(index)}
                        />
                    ))}
                    {type !== "components" && (
                        <SceneElementListItem
                            categoryTitle="Empty"
                            onClick={() => {
                                EditorControlFunctions.createObjectFromSceneElement();
                                onSelect();
                            }}
                        />
                    )}
                </div>
            )}

            {(isInSearchMode.value || selectedCategories.value.length > 0) && (
                <ul className="w-full">
                    {shelves.flatMap(([_, items], index) =>
                        selectedCategories.value.includes(index)
                            ? items.map(item =>
                                  type === "components" ? (
                                      <ComponentListItem
                                          key={item.jsonID || item.name}
                                          item={item}
                                          onSelect={onSelect}
                                      />
                                  ) : (
                                      <PrefabListItem
                                          key={item.url}
                                          item={item}
                                          onSelect={onSelect}
                                      />
                                  ),
                              )
                            : [],
                    )}
                </ul>
            )}
        </div>
    );
}

export default ElementList;
