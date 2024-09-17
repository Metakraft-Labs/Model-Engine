import React from "react";

import { Box, Tooltip } from "@mui/material";
import { LuInfo } from "react-icons/lu";
import { MdOutlineHelpOutline } from "react-icons/md";
import { twMerge } from "tailwind-merge";

/**
 * Used to provide styles for InputGroupContainer div.
 */
export const InputGroupContainer = ({ disabled = false, children, ...rest }) => (
    <Box
        sx={{
            display: disabled ? "block" : "flex",
            flex: "auto",
            px: disabled ? 0 : 2,
            py: disabled ? 0 : 1,
            opacity: disabled ? 0.3 : "",
        }}
        {...rest}
    >
        {children}
    </Box>
);

/**
 * Used to provide styles for InputGroupContent div.
 */
export const InputGroupContent = ({ children, ...props }) => (
    <Box
        ml={4}
        display={"flex"}
        justifyContent={"space-between"}
        sx={{
            "&>label": {
                display: "block",
                width: "35%",
                pb: 0.5,
                pt: 1,
                color: "#010101",
            },
            fontSize: "13px",
            "&>*:first-child": {
                maxWidth: "calc(100% - 2px)",
            },
        }}
        {...props}
    >
        {children}
    </Box>
);

export const InputGroupVerticalContainer = ({ disabled = false, children }) => (
    <div
        className={twMerge(
            disabled ? "pointer-events-none opacity-30" : "",
            "[&>label]:block [&>label]:w-[35%] [&>label]:pb-0.5 [&>label]:pt-1 [&>label]:text-[color:var(--textColor)]",
        )}
    >
        {children}
    </div>
);

export const InputGroupVerticalContainerWide = ({ disabled = false, children }) => (
    <Box
        sx={{
            opacity: disabled ? 0.3 : "",
            "&>label": {
                display: "block",
                width: "100%",
                pb: 0.5,
                pt: 1,
                color: "#010101",
            },
        }}
    >
        {children}
    </Box>
);

export const InputGroupVerticalContent = ({ children }) => (
    <Box display={"flex"} flex={1} flexDirection={"column"} pl={2}>
        {children}
    </Box>
);
/**
 * Used to provide styles for InputGroupInfoIcon div.
 */
// change later
// .info  text-[color:var(--textColor)] h-4 w-auto ml-[5px]
export const InputGroupInfoIcon = ({ onClick = () => {} }) => (
    <MdOutlineHelpOutline
        style={{
            marginLeft: "5px",
            display: "flex",
            width: "18px",
            cursor: "pointer",
            alignSelf: "center",
            justifySelf: "center",
            color: "#000000",
        }}
        onClick={onClick}
    />
);

/**
 * InputGroup used to render the view of component.
 */
export function InputGroup({ children, info, label, labelClassName, className, ...props }) {
    return (
        <Box display={"flex"} my={1} alignItems={"center"} justifyContent={"end"} {...props}>
            <Box mr={2} display={"flex"}>
                <label
                    style={{
                        marginRight: "2.5em",
                        textWrap: "wrap",
                        textAlign: "end",
                        fontSize: "13px",
                        color: "#A0A1A2",
                        ...labelClassName,
                    }}
                >
                    {label}
                </label>
                {info && (
                    <Tooltip title={info}>
                        <LuInfo
                            style={{
                                height: "5em",
                                width: "5em",
                                color: "#A0A1A2",
                            }}
                        />
                    </Tooltip>
                )}
            </Box>
            <Box width={60} sx={{ ...className }}>
                {children}
            </Box>
        </Box>
    );
}

export default InputGroup;
