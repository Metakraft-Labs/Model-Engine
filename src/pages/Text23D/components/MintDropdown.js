import { Menu, TextField } from "@mui/material";
import React, { useState } from "react";
import CreateNFT from "../../../components/CreateNFT";

export default function MintDropdown({ open, handleClose, byteRes, url, prompt }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    background: "#000000",
                    color: "#A5A5A5",
                    width: "278px",
                    borderRadius: "6px",
                    border: "1px solid #454646",
                    padding: "15px",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            <TextField
                sx={{
                    border: "1px solid #A557CA",
                    background: "#000000",
                    borderRadius: "7px",
                    color: "#FFFFFF",
                    "& textarea": {
                        color: "#FFFFFF",
                    },
                    "& [placeholder]": {
                        color: "#FFFFFF",
                    },
                }}
                placeholder="Name"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <TextField
                sx={{
                    border: "1px solid #A557CA",
                    background: "#000000",
                    borderRadius: "7px",
                    color: "#FFFFFF",
                    "& textarea": {
                        color: "#FFFFFF",
                    },
                    "& [placeholder]": {
                        color: "#FFFFFF",
                    },
                    mt: "10px",
                    mb: "10px",
                }}
                multiline
                rows={2}
                placeholder="Description"
                fullWidth
                value={description}
                onChange={e => setDescription(e.target.value)}
            />

            <CreateNFT fileURI={byteRes} url={url} type={"3d"} prompt={prompt} />
        </Menu>
    );
}
