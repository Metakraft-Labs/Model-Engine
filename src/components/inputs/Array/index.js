import { Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import { useDrop } from "react-dnd";
import { HiPlus } from "react-icons/hi";
import { PiTrashSimple } from "react-icons/pi";
import { twMerge } from "tailwind-merge";
import Input from "../../Input";
import Label from "../../Label";
import { SupportedFileTypes } from "../../scene-editor/constants/AssetTypes";

const DiscardableInput = ({ value, index, inputLabel, onChange, onRemove, dropTypes }) => {
    const [{ isDroppable }, dropRef] = useDrop(() => ({
        accept: dropTypes ?? [...SupportedFileTypes],
        drop: item => {
            onChange(item.url, index);
        },
        collect: monitor => ({
            isDroppable: monitor.canDrop() && monitor.isOver(),
        }),
    }));

    return (
        <div className="flex flex-col px-3">
            {inputLabel && (
                <Label className="mb-1 text-[#A0A1A2]">{inputLabel + " " + (index + 1)}</Label>
            )}
            <div
                ref={dropRef}
                className={twMerge(
                    "mb-2 flex items-center",
                    isDroppable && "outline outline-2 outline-white",
                )}
            >
                <Input
                    containerClassname="flex-grow"
                    className="border-none bg-[#242424] text-[#8B8B8D]"
                    value={value}
                    onChange={event => onChange(event.target.value, index)}
                />
                <PiTrashSimple
                    className="ml-2.5 cursor-pointer text-[#444]"
                    onClick={() => onRemove(index)}
                />
            </div>
        </div>
    );
};

export default function ArrayInputGroup({
    name,
    label,
    containerClassName,
    values: initialValues,
    onChange,
    inputLabel,
    dropTypes,
}) {
    const [values, setValues] = useState(initialValues);

    const handleChange = useCallback(
        (value, index, addRemove) => {
            setValues(prevValues => {
                let newValues;

                if (addRemove === "add") {
                    newValues = [...prevValues, value];
                } else if (addRemove === "remove") {
                    newValues = prevValues.filter((_, idx) => idx !== index);
                } else {
                    newValues = prevValues.map((v, idx) => (idx === index ? value : v));
                }

                onChange(newValues);
                return newValues;
            });
        },
        [onChange],
    );

    const [{ isGroupDroppable }, groupDropRef] = useDrop(
        () => ({
            accept: dropTypes ?? [...SupportedFileTypes],
            drop: (item, monitor) => {
                if (monitor.didDrop()) {
                    return; // don't handle the drop if a child component already did
                }
                handleChange(item.url, 0, "add");
            },
            collect: monitor => ({
                isGroupDroppable: monitor.canDrop() && monitor.isOver({ shallow: true }),
            }),
        }),
        [handleChange],
    );

    return (
        <div ref={groupDropRef} aria-label={name} className={containerClassName}>
            <div
                className={`outline outline-2 transition-colors duration-200 ${
                    isGroupDroppable ? "outline-white" : "outline-transparent"
                }`}
            >
                <div className="mb-3 flex items-center justify-between">
                    <Typography className="ml-5">{label}</Typography>
                    <HiPlus
                        className="mr-5 cursor-pointer rounded-md bg-[#1A1A1A] text-white"
                        size="20px"
                        onClick={() => handleChange("", 0, "add")}
                    />
                </div>
                <div className="flex flex-col space-y-1 rounded-md bg-[#1A1A1A] py-1.5">
                    {values.map((value, idx) => (
                        <DiscardableInput
                            key={value + idx}
                            value={value}
                            index={idx}
                            inputLabel={inputLabel}
                            onChange={handleChange}
                            onRemove={index => handleChange("", index, "remove")}
                            dropTypes={dropTypes}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
