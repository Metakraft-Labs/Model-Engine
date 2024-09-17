import { Button } from "@mui/material";
import React from "react";

export function SidebarButton({ children, className, ...rest }) {
    return (
        <Button
            sx={{
                background: "#141619",
            }}
            {...rest}
        >
            {children}
        </Button>
    );
}
