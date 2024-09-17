import { TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

const StringInput = ({ value, onChange, onRelease, className, inputRef, ...rest }) => {
    return (
        <TextField
            className={twMerge(
                "h-full text-ellipsis rounded-lg border-none bg-[#1A1A1A] px-5 py-2 text-xs font-normal text-[#8B8B8D]",
                className,
            )}
            value={value}
            onChange={e => {
                onChange?.(e.target.value);
            }}
            onBlur={e => {
                onRelease?.(e.target.value);
            }}
            onFocus={e => {
                onRelease?.(e.target.value);
            }}
            ref={inputRef}
            {...rest}
        />
    );
};

StringInput.displayName = "StringInput";
StringInput.defaultProps = {
    value: "",
    onChange: () => {},
    type: "text",
    required: false,
    placeholder: "",
};

export default StringInput;

// do we really need a controlled string input? we could easily integrate this with string input itself
export const ControlledStringInput = React.forwardRef((values, ref) => {
    const {
        onChange,
        onRelease,
        value,
        placeholder,
        disabled,
        type,
        containerClassname,
        className,
        ...rest
    } = values;
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const onBlur = () => {
        onRelease?.(tempValue);
    };

    const onChangeValue = value => {
        setTempValue(value);
        onChange?.(value);
    };

    return (
        <TextField
            ref={ref}
            containerClassname={twMerge("w-50 h-10 overflow-hidden rounded-lg", containerClassname)}
            className={twMerge(
                "h-full text-ellipsis rounded-lg border-none bg-[#1A1A1A] px-5 py-2 text-xs font-normal text-[#8B8B8D]",
                className,
            )}
            value={tempValue ?? ""}
            onChange={e => {
                onChangeValue(e.target.value);
            }}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            type="text"
        />
    );
});

ControlledStringInput.displayName = "ControlledStringInput";

ControlledStringInput.defaultProps = {
    value: "",
    onChange: () => {},
    type: "text",
};
