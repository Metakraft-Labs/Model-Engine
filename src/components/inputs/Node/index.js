import React from "react";
import { useDrop } from "react-dnd";
import { UUIDComponent, getComponent } from "../../../ecs";
import { ItemTypes } from "../../scene-editor/constants/AssetTypes";
import { ControlledStringInput } from "../String";

export function NodeInput({ onRelease, value, ...rest }) {
    const [{ canDrop, isOver }, dropRef] = useDrop({
        accept: [ItemTypes.Node],
        async drop(item, monitor) {
            const entity = item.value;
            const uuid = getComponent(entity, UUIDComponent);
            onRelease?.(uuid);
        },
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    return <ControlledStringInput ref={dropRef} value={value} {...rest} />;
}

NodeInput.defaultProps = {};

export default NodeInput;
