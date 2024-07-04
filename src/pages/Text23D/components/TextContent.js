import { Box, TextField, Typography } from "@mui/material";
import React from "react";

export default function TextContent({ prompt, setPrompt }) {
    return (
        <Box display={"flex"} gap={"20px"} flexDirection={"column"}>
            <Typography color="#FFFFFF">Text Prompt</Typography>

            <TextField
                multiline
                rows={4}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                sx={{
                    border: "2px solid #202020",
                    background: "#000000",
                    borderRadius: "7px",
                    color: "#FFFFFF",
                    "& textarea": {
                        color: "#FFFFFF",
                    },
                }}
            />
        </Box>
    );
}
