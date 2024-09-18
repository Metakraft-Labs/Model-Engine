import React, { forwardRef, useEffect } from "react";

import { Typography } from "@mui/material";
import { twMerge } from "tailwind-merge";
import { useHookstate } from "../../hyperflux";

const Accordion = forwardRef(
    (
        {
            title,
            subtitle,
            expandIcon,
            shrinkIcon,
            prefixIcon,
            children,
            className,
            titleClassName,
            titleFontSize = "xl",
            open,
            ...props
        },
        ref,
    ) => {
        const twClassName = twMerge("w-full rounded-2xl bg-theme-surface-main p-6 ", className);
        const twClassNameTitle = twMerge("flex flex-row items-center", titleClassName);
        const openState = useHookstate(false);

        useEffect(() => {
            openState.set(!!open);
        }, [open]);

        return (
            <div className={twClassName} {...props} ref={ref}>
                <div
                    className="flex w-full cursor-pointer items-center justify-between hover:bg-theme-highlight"
                    onClick={() => {
                        openState.set(v => !v);
                    }}
                >
                    <div className={twClassNameTitle}>
                        {prefixIcon && <div className="mr-2">{prefixIcon}</div>}
                        <Typography component="h2" fontSize={titleFontSize} fontWeight="semibold">
                            {title}
                        </Typography>
                    </div>

                    {openState.value ? shrinkIcon : expandIcon}
                </div>

                {!openState.value && subtitle && (
                    <Typography
                        component="h3"
                        fontSize="base"
                        fontWeight="light"
                        className="mt-2 w-full dark:text-[#A3A3A3]"
                    >
                        {subtitle}
                    </Typography>
                )}

                {openState.value && children}
            </div>
        );
    },
);

export default Accordion;
