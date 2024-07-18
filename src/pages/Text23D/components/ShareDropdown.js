import { Download, Share, Twitter } from "@mui/icons-material";
import { Box, Button, CircularProgress, Menu, Typography } from "@mui/material";
import React, { Suspense } from "react";
import { ModelToVideo } from "../../../components/ModelToVideo";

export default function ShareDropdown({ open, handleClose, model }) {
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
                borderRadius={"8px"}
                mb={"10px"}
            >
                <Suspense fallback={<CircularProgress />}>
                    <ModelToVideo url={model} />
                </Suspense>
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
                onClick={() =>
                    window.open(
                        "https://twitter.com/intent/tweet?text=Hey%20I%20love%20%40TheMetakraft%2C%20you%20should%20definitely%20try%20it.%20#TheMetakraft",
                    )
                }
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
