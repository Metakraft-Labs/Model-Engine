import SketchPicker from "@uiw/react-color-sketch";
import React from "react";
import { Color } from "three";

import { Typography } from "@mui/material";
import { twMerge } from "tailwind-merge";

export function ColorInput({
    value,
    onChange,
    onRelease,
    disabled,
    className,
    textClassName,
    sketchPickerClassName,
}) {
    const hexColor = typeof value.getHexString === "function" ? "#" + value.getHexString() : "#000";

    const handleChange = result => {
        const color = new Color(result.hex);
        onChange(color);
    };
    return (
        <div
            className={twMerge(
                "relative flex h-9 items-center gap-1 rounded-lg border-none bg-[#1A1A1A] px-2 text-xs text-[#8B8B8D]",
                disabled && "cursor-not-allowed",
                className,
            )}
        >
            <div
                tabIndex={0}
                className={`group h-5 w-5 cursor-pointer rounded border border-black focus:border-theme-primary`}
                style={{ backgroundColor: hexColor }}
            >
                <SketchPicker
                    className={twMerge(
                        "absolute z-10 mt-5 scale-0 bg-theme-surface-main focus-within:scale-100 group-focus:scale-100",
                        sketchPickerClassName,
                    )}
                    color={hexColor}
                    onChange={handleChange}
                    disableAlpha={true}
                    onPointerLeave={() => {
                        onRelease && onRelease(value);
                    }}
                />
            </div>
            <Typography fontSize="xs" className={textClassName}>
                {hexColor.toUpperCase()}
            </Typography>
        </div>
    );
}

ColorInput.defaultProps = {
    value: new Color(),
    onChange: () => {},
};

export default ColorInput;
