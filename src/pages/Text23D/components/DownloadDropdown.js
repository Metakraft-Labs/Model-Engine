import { Menu, MenuItem } from "@mui/material";
import React from "react";
import useConvertModels from "../../../hooks/useConvertModels";

export default function DownloadDropdown({ open, handleClose, model }) {
    const convertModels = useConvertModels(model || "./models/logo_model.glb");

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
            <MenuItem onClick={() => (window.location.href = model)}>GLB</MenuItem>
            <MenuItem onClick={() => convertModels.toOBJ()}>OBJ</MenuItem>
            <MenuItem onClick={() => convertModels.toGLTF()}>GLTF</MenuItem>
            <MenuItem onClick={() => convertModels.toPLY()}>PLY</MenuItem>
            <MenuItem onClick={() => convertModels.toSTL()}>STL</MenuItem>
        </Menu>
    );
}
