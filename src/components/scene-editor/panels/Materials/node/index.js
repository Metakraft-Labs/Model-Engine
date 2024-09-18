import React, { useCallback } from "react";
import { useDrag } from "react-dnd";

import { getOptionalComponent, useOptionalComponent, UUIDComponent } from "../../../../../ecs";
import { MaterialSelectionState } from "../../../../../engine/scene/materials/MaterialLibraryState";
import { getMutableState, useHookstate, useMutableState } from "../../../../../hyperflux";

import { HiOutlineArchiveBox } from "react-icons/hi2";
import { SiRoundcube } from "react-icons/si";
import { twMerge } from "tailwind-merge";
import { NameComponent } from "../../../../../spatial/common/NameComponent";
import { MaterialStateComponent } from "../../../../../spatial/renderer/materials/MaterialComponent";
import { ItemTypes } from "../../../constants/AssetTypes";
import { SelectionState } from "../../../services/SelectionServices";

const nodeDisplayName = uuid => {
    return (
        getOptionalComponent(UUIDComponent.getEntityByUUID(uuid), MaterialStateComponent)?.material
            ?.name ?? ""
    );
};

export default function MaterialLibraryEntry(props) {
    const data = props.data;
    const node = data.nodes[props.index];

    const selectionState = useMutableState(SelectionState);

    /**@todo use asset source decoupled from uuid to make this less brittle */
    const source = node.includes("/") ? node.split("/")?.pop()?.split("?")[0] : null;
    const name = useOptionalComponent(UUIDComponent.getEntityByUUID(node), NameComponent);

    const onClickNode = e => {
        if (!source) data.onClick(e, node);
    };

    const onCollapseNode = useCallback(
        e => {
            e.stopPropagation();
            //data.onCollapse(e, node)
        },
        [node, data.onCollapse],
    );

    const [_dragProps, drag] = useDrag({
        type: ItemTypes.Material,
        item() {
            const selectedEntities = selectionState.selectedEntities.value;
            const multiple = selectedEntities.length > 1;
            return {
                type: ItemTypes.Material,
                multiple,
                value: node[0],
            };
        },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const materialSelection = useHookstate(
        getMutableState(MaterialSelectionState).selectedMaterial,
    );
    return (
        <li
            style={props.style}
            ref={drag}
            id={node[0]}
            className={twMerge(
                `bg-${props.index % 2 ? "theme-surfaceInput" : "zinc-800"}`,
                materialSelection.value === node ? "border border-gray-100" : "border-none",
            )}
            onClick={onClickNode}
        >
            <div ref={drag} id={node[0]} tabIndex={0} className={``} onClick={onClickNode}>
                {source ? (
                    <div className={"flex items-center pl-3.5 pr-2"}>
                        <div className="flex flex-1 items-center bg-inherit py-0.5 pl-0 pr-1">
                            <HiOutlineArchiveBox className="h-5 w-5 flex-shrink-0 text-white dark:text-[#A3A3A3]" />
                            <div className="flex flex-1 items-center">
                                <div className="ml-2 min-w-0 flex-1 text-nowrap rounded bg-transparent px-0.5 py-0 text-inherit text-white dark:text-[#A3A3A3]">
                                    <span className="text-nowrap text-sm leading-4">{source}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={"flex items-center pl-9 pr-6"}>
                        <div className="flex flex-1 items-center bg-inherit py-0.5 pl-0 pr-1">
                            <SiRoundcube className="h-5 w-5 flex-shrink-0 text-white dark:text-[#A3A3A3]" />
                            <div className="flex flex-1 items-center">
                                <div className="ml-2 min-w-0 flex-1 text-nowrap rounded bg-transparent px-0.5 py-0 text-inherit text-white dark:text-[#A3A3A3]">
                                    <span className="text-nowrap text-sm leading-4">
                                        {name?.value || ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </li>
    );
}
