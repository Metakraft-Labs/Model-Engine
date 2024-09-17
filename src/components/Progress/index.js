import React from "react";
import { twMerge } from "tailwind-merge";

const sizes = {
    small: "h-1.5",
    default: "h-2.5",
    large: "h-4",
    extralarge: "h-6",
};

const Progress = ({ className, barClassName, value, size = "default" }) => {
    const twClassName = twMerge(
        sizes[size],
        "w-full rounded-full bg-gray-200 dark:bg-gray-700",
        className,
    );
    const twBarClassName = twMerge(sizes[size], "rounded-full bg-blue-primary", barClassName);

    return (
        <div className={twClassName}>
            <div className={twBarClassName} style={{ width: `${value}%` }} />
        </div>
    );
};

export default Progress;
