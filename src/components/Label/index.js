import React from "react";
import { twMerge } from "tailwind-merge";

const Label = ({ className, children, ...props }) => {
    return (
        <label
            className={twMerge(
                "inline-block text-sm font-medium leading-none text-theme-secondary peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className,
            )}
            {...props}
        >
            {children}
        </label>
    );
};

export default Label;
