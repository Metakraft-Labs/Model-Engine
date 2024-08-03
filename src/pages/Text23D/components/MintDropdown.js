import { Box, Menu, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import CreateNFT from "../../../components/CreateNFT";
import { CoinIcon } from "../../../icons/CoinIcon";

export default function MintDropdown({ open, handleClose, byteRes, url, prompt }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");

    const fieldStyle = {
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
    };

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
                sx={fieldStyle}
                placeholder="Name"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <TextField
                sx={fieldStyle}
                multiline
                rows={2}
                placeholder="Description"
                fullWidth
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <TextField
                sx={fieldStyle}
                placeholder="Tags (separated by commas)"
                fullWidth
                value={tags}
                onChange={e => setTags(e.target.value)}
            />

            <Box
                border={"1px solid #A557CA"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                padding={"10px 15px"}
                mb={"10px"}
                borderRadius={"8px"}
            >
                <Typography>Listing Price:</Typography>
                <Typography display={"flex"} gap={"10px"} alignItems={"center"}>
                    <CoinIcon /> 10
                </Typography>
            </Box>

            <CreateNFT
                name={name}
                description={description}
                fileURI={byteRes}
                url={url}
                type={"3d"}
                prompt={prompt}
                tags={tags
                    ?.split(",")
                    ?.filter(t => !!t)
                    ?.map(t => t?.trim())}
            />
        </Menu>
    );
}
