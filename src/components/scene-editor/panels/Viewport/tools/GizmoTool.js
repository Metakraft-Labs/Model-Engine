import { Tooltip } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbPointer, TbRefresh, TbVector, TbWindowMaximize } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import { TransformMode } from "../../../../../engine/scene/constants/transformConstants";
import { useMutableState } from "../../../../../hyperflux";
import Button from "../../../../Button";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { setTransformMode } from "../../../functions/transformFunctions";
import { EditorHelperState } from "../../../services/EditorHelperState";

function Placer() {
    return (
        <>
            <div className="mt-2 h-1 w-6 bg-[#2B2C30]" />
            <div className="mt-1 h-1 w-6 bg-[#2B2C30]" />
        </>
    );
}

export default function GizmoTool({ viewportRef, toolbarRef }) {
    const editorHelperState = useMutableState(EditorHelperState);
    const transformMode = editorHelperState.transformMode.value;
    const { t } = useTranslation();
    const [position, setPosition] = useState({ x: 16, y: 56 });
    const [isDragging, setIsDragging] = useState(false);
    const gizmoRef = useRef < HTMLDivElement > null;
    const [pointerSelected, setPointerSelected] = useState(false);

    const [startingMouseX, setStartingMouseX] = useState(0);
    const [startingMouseY, setStartingMouseY] = useState(0);

    const handleMouseDown = e => {
        setIsDragging(true);
        setStartingMouseX(e.clientX);
        setStartingMouseY(e.clientY);
    };

    const handleMouseMove = e => {
        if (isDragging && viewportRef.current && gizmoRef.current && toolbarRef.current) {
            const viewportRect = viewportRef.current.getBoundingClientRect();
            const gizmoRect = gizmoRef.current.getBoundingClientRect();
            const toolbarRect = toolbarRef.current.getBoundingClientRect();
            const offsetX = e.clientX - startingMouseX;
            const offsetY = e.clientY - startingMouseY;

            const newX = Math.max(
                0,
                Math.min(position.x + offsetX, viewportRect.width - gizmoRect.width),
            );
            const newY = Math.max(
                toolbarRect.height,
                Math.min(position.y + offsetY, viewportRect.height - gizmoRect.height),
            );

            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={gizmoRef}
            className={`absolute z-[5] flex flex-col items-center rounded-lg bg-black p-2`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <div
                className={`z-[6] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={handleMouseDown}
            >
                <Placer />
            </div>
            <div className="mt-2 flex flex-col rounded">
                <Tooltip title={t("editor:toolbar.gizmo.pointer")} position={"right center"}>
                    <Button
                        variant="transparent"
                        className={twMerge(
                            "border-b border-b-theme-primary p-2 text-[#A3A3A3]",
                            pointerSelected && "bg-theme-highlight text-white",
                        )}
                        iconContainerClassName="m-0"
                        startIcon={<TbPointer />}
                        onClick={() => {
                            setPointerSelected(true);
                            EditorControlFunctions.replaceSelection([]);
                        }}
                    />
                </Tooltip>
                <Tooltip title={t("editor:toolbar.gizmo.translate")} position={"right center"}>
                    <Button
                        variant="transparent"
                        className={twMerge(
                            "border-b border-b-theme-primary p-2 text-[#A3A3A3]",
                            !pointerSelected &&
                                transformMode === TransformMode.translate &&
                                "bg-theme-highlight text-white",
                        )}
                        iconContainerClassName="m-0"
                        startIcon={<TbVector />}
                        onClick={() => {
                            setPointerSelected(false);
                            setTransformMode(TransformMode.translate);
                        }}
                    />
                </Tooltip>
                <Tooltip title={t("editor:toolbar.gizmo.rotate")} position={"right center"}>
                    <Button
                        variant="transparent"
                        className={twMerge(
                            "border-b border-b-theme-primary p-2 text-[#A3A3A3]",
                            !pointerSelected &&
                                transformMode === TransformMode.rotate &&
                                "bg-theme-highlight text-white",
                        )}
                        iconContainerClassName="m-0"
                        startIcon={<TbRefresh />}
                        onClick={() => {
                            setPointerSelected(false);
                            setTransformMode(TransformMode.rotate);
                        }}
                    />
                </Tooltip>
                <Tooltip title={t("editor:toolbar.gizmo.scale")} position={"right center"}>
                    <Button
                        variant="transparent"
                        className={twMerge(
                            "p-2 text-[#A3A3A3]",
                            !pointerSelected &&
                                transformMode === TransformMode.scale &&
                                "bg-theme-highlight text-white",
                        )}
                        iconContainerClassName="m-0"
                        startIcon={<TbWindowMaximize />}
                        onClick={() => {
                            setPointerSelected(false);
                            setTransformMode(TransformMode.scale);
                        }}
                    />
                </Tooltip>
            </div>
        </div>
    );
}
