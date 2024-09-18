import { Typography } from "@mui/material";
import React, { Fragment, useState } from "react";
import { BiSolidComponent } from "react-icons/bi";
import { HiOutlineChevronDown, HiOutlineChevronRight } from "react-icons/hi";
import { HiMiniXMark } from "react-icons/hi2";
import Button from "../../../Button";

const PropertyGroup = ({ name, icon, description, children, onClose, minimizedDefault }) => {
    const [minimized, setMinimized] = useState(minimizedDefault ?? true);

    return (
        <div className="justify-left flex w-full flex-col items-start rounded border-solid bg-[#212226] px-4 py-1.5">
            <div className="flex w-full items-center gap-2 text-theme-gray3">
                <Button
                    onClick={() => setMinimized(!minimized)}
                    variant="outline"
                    startIcon={minimized ? <HiOutlineChevronRight /> : <HiOutlineChevronDown />}
                    className="ml-0 h-4 border-0 p-0 text-[#444444]"
                />
                {icon}
                {name && <Typography>{name}</Typography>}
                <div className="ml-auto mr-0 flex items-center gap-3 text-white">
                    {onClose && (
                        <button onPointerUp={onClose}>
                            <HiMiniXMark />
                        </button>
                    )}
                    {/*<MdDragIndicator className="rotate-90" />*/}
                </div>
            </div>
            {!minimized && description && (
                <Typography fontSize="xs" className="ml-8 py-2">
                    {description.split("\\n").map((line, idx) => (
                        <Fragment key={idx}>
                            {line}
                            <br />
                        </Fragment>
                    ))}
                </Typography>
            )}
            {!minimized && <div className="flex w-full flex-col py-2">{children}</div>}
        </div>
    );
};

PropertyGroup.defaultProps = {
    name: "Component name",
    icon: <BiSolidComponent />,
};

export default PropertyGroup;
