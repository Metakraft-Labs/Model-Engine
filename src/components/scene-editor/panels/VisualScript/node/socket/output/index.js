import React from "react";
import { FaCaretRight } from "react-icons/fa6";
import { Handle, Position, useReactFlow } from "reactflow";

import { twMerge } from "tailwind-merge";
import { isValidConnection } from "../../../../../visualScript/VisualScriptUIModule";
import { colors, valueTypeColorMap } from "../../../util/colors";

export default function OutputSocket({ specGenerator, connected, ...rest }) {
    const { name, valueType, collapsed, offset } = rest;

    const instance = useReactFlow();
    const isFlowSocket = valueType === "flow";
    let colorName = valueTypeColorMap[valueType];
    if (colorName === undefined) {
        colorName = "red";
    }
    // @ts-ignore
    const [backgroundColor, borderColor] = colors[colorName];
    const showName = isFlowSocket === false || name !== "flow";
    const position = {};
    if (offset?.x !== undefined) position["right"] = `${offset.x}%`;
    if (offset?.y !== undefined) position["top"] = `${offset.y}%`;

    return (
        <div
            className={twMerge(
                "flex-end relative flex h-4 grow items-center justify-end",
                collapsed ? "absolute" : "",
            )}
            style={position}
        >
            {showName && !collapsed && <div className="ml-2 mr-4 capitalize">{name}</div>}
            {isFlowSocket && (
                <FaCaretRight
                    color="#ffffff"
                    size="1.25rem"
                    className="ml-1"
                    style={{
                        marginLeft: "0.25rem",
                    }}
                />
            )}

            <Handle
                id={name}
                type="source"
                position={Position.Right}
                className={twMerge(
                    "socket-output-handle",
                    connected ? backgroundColor : "bg-white",
                    borderColor,
                    "h-2.5 w-2.5",
                    collapsed ? "" : "right-[-12px]",
                )}
                isValidConnection={connection =>
                    isValidConnection(connection, instance, specGenerator)
                }
            />
        </div>
    );
}
