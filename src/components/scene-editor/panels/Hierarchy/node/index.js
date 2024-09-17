import React, { useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";

import { PiEyeBold, PiEyeClosedBold } from "react-icons/pi";
import {
    getAllComponents,
    getComponent,
    getOptionalComponent,
    hasComponent,
    useComponent,
    useOptionalComponent,
} from "../../../../../ecs/ComponentFunctions";
import { entityExists } from "../../../../../ecs/EntityFunctions";
import { NameComponent } from "../../../../../spatial/common/NameComponent";
import {
    EntityTreeComponent,
    isAncestor,
} from "../../../../../spatial/transform/components/EntityTree";

import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";

import { getMutableState, getState, useHookstate } from "../../../../../hyperflux";

import { twMerge } from "tailwind-merge";
import { UUIDComponent } from "../../../../../ecs";
import {
    VisibleComponent,
    setVisibleComponent,
} from "../../../../../spatial/renderer/components/VisibleComponent";
import { ItemTypes, SupportedFileTypes } from "../../../constants/AssetTypes";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { addMediaNode } from "../../../functions/addMediaNode";
import TransformPropertyGroup from "../../../properties/transform";
import { ComponentEditorsState } from "../../../services/ComponentEditors";
import { SelectionState } from "../../../services/SelectionServices";

/**
 * getNodeElId function provides id for node.
 */
export const getNodeElId = node => {
    return "hierarchy-node-" + node.entity;
};

export const HierarchyTreeNode = props => {
    const node = props.data.nodes[props.index];
    const entity = node.entity;
    const data = props.data;
    const fixedSizeListStyles = props.style;

    const uuid = useComponent(entity, UUIDComponent);

    const selected = useHookstate(getMutableState(SelectionState).selectedEntities).value.includes(
        uuid.value,
    );

    const nodeName = useOptionalComponent(entity, NameComponent)?.value;

    const visible = useOptionalComponent(entity, VisibleComponent);

    const toggleVisible = () => {
        if (visible) {
            EditorControlFunctions.addOrRemoveComponent([entity], VisibleComponent, false);
        } else {
            EditorControlFunctions.addOrRemoveComponent([entity], VisibleComponent, true);
        }
        setVisibleComponent(entity, !hasComponent(entity, VisibleComponent));
    };

    const onClickToggle = e => {
        e.stopPropagation();
        if (data.onToggle) data.onToggle(e, entity);
    };
    const onNodeKeyDown = e => {
        if (data.onKeyDown) data.onKeyDown(e, entity);
    };
    const onKeyDownNameInput = e => {
        if (e.key === "Escape") data.onRenameSubmit(entity, null);
        else if (e.key === "Enter") data.onRenameSubmit(entity, e.target.value);
    };
    const onClickNode = e => data.onClick(e, entity);
    const onChangeNodeName = e => data.onChangeName(entity, e.target.value);

    const [, drag, preview] = useDrag({
        type: ItemTypes.Node,
        item: () => {
            const selectedEntities = SelectionState.getSelectedEntities();

            if (selectedEntities.includes(node.entity)) {
                const multiple = selectedEntities.length > 1;
                return {
                    type: ItemTypes.Node,
                    multiple,
                    value: multiple ? selectedEntities : selectedEntities[0],
                };
            }
            return {
                type: ItemTypes.Node,
                multiple: false,
                value: node.entity,
            };
        },
        canDrag: () =>
            !SelectionState.getSelectedEntities().some(
                entity => !getOptionalComponent(entity, EntityTreeComponent)?.parentEntity,
            ),
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const dropItem = (node, place) => {
        let parentNode;
        let beforeNode;

        if (place === "Before") {
            const entityTreeComponent = getOptionalComponent(node.entity, EntityTreeComponent);
            parentNode = entityTreeComponent?.parentEntity;
            beforeNode = node.entity;
        } else if (place === "After") {
            const entityTreeComponent = getOptionalComponent(node.entity, EntityTreeComponent);
            parentNode = entityTreeComponent?.parentEntity;
            const parentTreeComponent = getOptionalComponent(
                entityTreeComponent?.parentEntity,
                EntityTreeComponent,
            );
            if (
                parentTreeComponent &&
                !node.lastChild &&
                parentNode &&
                parentTreeComponent?.children.length > node.childIndex + 1
            ) {
                beforeNode = parentTreeComponent.children[node.childIndex + 1];
            }
        } else {
            parentNode = node.entity;
        }

        if (!parentNode)
            return () => {
                console.warn("parent is not defined");
            };

        return (item, monitor) => {
            if (parentNode) {
                if ("files" in item) {
                    const dndItem = monitor.getItem();
                    const entries = Array.from(dndItem.items).map(item => item.webkitGetAsEntry());

                    //uploading files then adding as media to the editor
                    data.onUpload(entries).then(assets => {
                        if (!assets) return;
                        for (const asset of assets) {
                            addMediaNode(asset, parentNode, beforeNode);
                        }
                    });
                    return;
                }

                if ("url" in item) {
                    addMediaNode(item.url, parentNode, beforeNode);
                    return;
                }

                if ("type" in item && item.type === ItemTypes.Component) {
                    EditorControlFunctions.createObjectFromSceneElement(
                        [{ name: item.componentJsonID }],
                        parentNode,
                        beforeNode,
                    );
                    return;
                }
            }

            EditorControlFunctions.reparentObject(
                Array.isArray(item.value) ? item.value : [item.value],
                beforeNode,
                parentNode === null ? undefined : parentNode,
            );
        };
    };

    const canDropItem = (entityNode, dropOn) => {
        return (item, monitor) => {
            if (!monitor.isOver()) {
                return false;
            }

            if (!dropOn) {
                const entityTreeComponent = getComponent(entityNode, EntityTreeComponent);
                if (!entityTreeComponent) {
                    return false;
                }
            }
            if (item.type === ItemTypes.Node) {
                const entityTreeComponent = getComponent(entityNode, EntityTreeComponent);

                return (
                    (dropOn || !!entityTreeComponent.parentEntity) &&
                    !(item.multiple
                        ? item.value.some(otherObject => isAncestor(otherObject, entityNode))
                        : isAncestor(item.value, entityNode))
                );
            }
            return true;
        };
    };

    const [{ canDropBefore, isOverBefore }, beforeDropTarget] = useDrop({
        accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ...SupportedFileTypes],
        drop: dropItem(node, "Before"),
        canDrop: canDropItem(node.entity),
        collect: monitor => ({
            canDropBefore: monitor.canDrop(),
            isOverBefore: monitor.isOver(),
        }),
    });

    const [{ canDropAfter, isOverAfter }, afterDropTarget] = useDrop({
        accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ...SupportedFileTypes],
        drop: dropItem(node, "After"),
        canDrop: canDropItem(node.entity),
        collect: monitor => ({
            canDropAfter: monitor.canDrop(),
            isOverAfter: monitor.isOver(),
        }),
    });

    const [{ canDropOn, isOverOn }, onDropTarget] = useDrop({
        accept: [ItemTypes.Node, ItemTypes.File, ItemTypes.Component, ...SupportedFileTypes],
        drop: dropItem(node, "On"),
        canDrop: canDropItem(node.entity, true),
        collect: monitor => ({
            canDropOn: monitor.canDrop(),
            isOverOn: monitor.isOver(),
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    const icons = entityExists(node.entity)
        ? getAllComponents(node.entity)
              .map(c => getState(ComponentEditorsState)[c.name]?.iconComponent)
              .filter(icon => !!icon)
        : [];
    const IconComponent = icons.length > 0 ? icons[0] : TransformPropertyGroup.iconComponent;
    const renaming = data.renamingNode && data.renamingNode.entity === node.entity;

    return (
        <li
            style={fixedSizeListStyles}
            className={twMerge(
                "cursor-pointer",
                selected ? "text-white" : "text-[#b2b5bd]",
                selected && (props.index % 2 ? "bg-[#1d1f23]" : "bg-zinc-900"),
                !selected &&
                    (props.index % 2
                        ? "bg-[#141619] hover:bg-[#1d1f23]"
                        : "bg-[#080808] hover:bg-zinc-900"),
                !visible && (props.index % 2 ? "bg-[#191B1F]" : "bg-[#0e0f11]"),
                !visible && "text-[#42454d]",
                "hover:text-white",
            )}
        >
            <div
                ref={drag}
                id={getNodeElId(node)}
                tabIndex={0}
                onKeyDown={onNodeKeyDown}
                onClick={onClickNode}
                onContextMenu={event => props.onContextMenu(event, entity)}
                className="py-.5 ml-3.5 h-9 justify-between bg-inherit pr-2"
            >
                <div
                    className={twMerge("h-1", isOverBefore && canDropBefore && "bg-white")}
                    style={{ marginLeft: `${node.depth * 1.25}em` }}
                    ref={beforeDropTarget}
                />

                <div
                    className="flex items-center bg-inherit pr-2"
                    style={{ paddingLeft: `${node.depth * 1.25}em` }}
                    ref={onDropTarget}
                >
                    {node.isLeaf ? (
                        <div className="w-5 shrink-0" />
                    ) : (
                        <button
                            type="button"
                            className="m-0 h-5 w-5 border-[none] bg-inherit p-0 hover:opacity-80"
                            onClick={onClickToggle}
                            onMouseDown={e => e.stopPropagation()}
                        >
                            {node.isCollapsed ? (
                                <MdKeyboardArrowRight className="font-small text-white" />
                            ) : (
                                <MdKeyboardArrowDown className="font-small text-white" />
                            )}
                        </button>
                    )}

                    <div className="flex flex-1 items-center gap-2 bg-inherit py-0.5 pl-0 pr-1 text-inherit ">
                        {IconComponent && (
                            <IconComponent className="h-5 w-5 flex-shrink-0 text-inherit" />
                        )}
                        <div className="flex flex-1 items-center">
                            {renaming ? (
                                <div className="relative h-[15px] w-full bg-inherit px-1 text-inherit">
                                    <input
                                        type="text"
                                        className="absolute top-[-3px] m-0 w-full rounded-none bg-inherit py-0.5 pl-0.5 text-sm"
                                        onChange={onChangeNodeName}
                                        onKeyDown={onKeyDownNameInput}
                                        value={data.renamingNode.name}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="ml-2 min-w-0 flex-1 text-nowrap rounded bg-transparent px-0.5 py-0 text-inherit ">
                                    <span className="text-nowrap text-sm leading-4">
                                        {nodeName}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="m-0 h-5 w-5 flex-shrink-0 border-none p-0 hover:opacity-80"
                            onClick={toggleVisible}
                        >
                            {visible ? (
                                <PiEyeBold className="font-small text-[#6B7280]" />
                            ) : (
                                <PiEyeClosedBold className="font-small text-[#42454d]" />
                            )}
                        </button>
                    </div>
                </div>

                <div
                    className={twMerge("h-1", isOverAfter && canDropAfter && "bg-white")}
                    style={{ marginLeft: `${node.depth * 1.25}em` }}
                    ref={afterDropTarget}
                />
            </div>
        </li>
    );
};

export default HierarchyTreeNode;
