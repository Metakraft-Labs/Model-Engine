import { Typography } from "@mui/material";
import React from "react";

const PanelIcon = ({ as: IconComponent, size = 12 }) => {
    return <IconComponent className="mr-[6px] w-[18px] text-[var(--textColor)]" size={size} />;
};

export const PanelTitle = ({ children }) => {
    return (
        <Typography fontSize="sm" className="leading-none">
            {children}
        </Typography>
    );
};

export const PanelDragContainer = ({ children }) => {
    return <div className="flex h-[30px] cursor-pointer rounded-t-md px-4 py-2">{children}</div>;
};

const Panel = ({ icon, title, children, toolbarContent, ...rest }) => {
    return (
        <div
            className="bg-surface-main relative flex flex-1 select-none flex-col overflow-hidden rounded"
            {...rest}
        >
            <div className="toolbar flex h-6 items-center border-b border-black border-opacity-20 p-1">
                {icon && <PanelIcon as={icon} size={12} />}
                <PanelTitle>{title}</PanelTitle>
                {toolbarContent}
            </div>
            <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>
        </div>
    );
};

export default Panel;
