import { Download, Share, Twitter } from "@mui/icons-material";
import { Box, Button, Menu, Typography } from "@mui/material";
import React from "react";

export default function ShareDropdown({ open, handleClose, imageUrl, model }) {
    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    display: "flex",
                    flexDirection: "column",
                    background: "#1A1A1D",
                    color: "#A5A5A5",
                    width: "284px",
                    borderRadius: "6px",
                    border: "1px solid #454646",
                    padding: "15px",
                    gap: "20px",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            <Box
                width={"100%"}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
                height="252px"
                sx={{
                    background: "#000000",
                }}
                borderRadius={"8px"}
                mb={"10px"}
            >
                <img
                    src={imageUrl}
                    height={"144px"}
                    width={"126px"}
                    alt={"generated-model-image"}
                />
            </Box>

            <Typography color={"#B4B4B4"} textAlign={"center"} fontSize={"17px"} mb={"10px"}>
                Share to win 10 credits!
            </Typography>
            <Typography color={"#707071"} fontSize={"13px"} mb={"10px"}>
                Earn up to 100 free credits monthly by sharing the model on Twitter or the link with
                others. Once someone clicks the preview link, 10 credits will be added to your
                account. Each generation can be credited only once.
            </Typography>

            <Button
                variant="contained"
                color="secondary"
                startIcon={<Twitter />}
                fullWidth
                sx={{ mb: "10px" }}
                size="small"
            >
                Twitter
            </Button>
            <Typography color={"#707071"} textAlign={"center"} fontSize={"11px"} mb={"10px"}>
                OR
            </Typography>
            <Box
                display={"flex"}
                justifyContent={"space-between"}
                gap={"10px"}
                alignItems={"center"}
            >
                <Button
                    fullWidth
                    startIcon={<Download />}
                    size="small"
                    variant="outlined"
                    onClick={() => (window.location.href = model)}
                >
                    Download
                </Button>
                <Button fullWidth startIcon={<Share />} size="small" variant="outlined">
                    Copy Link
                </Button>
            </Box>
        </Menu>
    );
}
