import { Menu, MenuItem } from "@mui/material";
import React from "react";

export default function DownloadDropdown({ models, open, handleClose }) {
    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    background: "#000000",
                    color: "#A5A5A5",
                    width: "117px",
                    borderRadius: "6px",
                    border: "1px solid #454646",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            {models?.map((model, i) => {
                return (
                    <MenuItem
                        key={`download-menu-${i}`}
                        onClick={() => (window.location.href = model?.link)}
                    >
                        {model?.name}
                    </MenuItem>
                );
            })}
        </Menu>
    );
}
