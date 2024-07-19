import { Check, Download, Share, Twitter } from "@mui/icons-material";
import { Box, Button, CircularProgress, Menu, Typography } from "@mui/material";
import React, { Suspense, useState } from "react";
import { ModelToVideo } from "../../../components/ModelToVideo";
import { copyToClipboard } from "../../../shared/strings";

export default function ShareDropdown({ open, handleClose, model, id }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        copyToClipboard(`${window.location.origin}/model-viewer?id=${id}`);
        setCopied(true);

        const timeout = setTimeout(() => {
            setCopied(false);
        }, 3000);

        return () => clearTimeout(timeout);
    };

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
                        `https://twitter.com/intent/tweet?text=I've%20crafted%20an%20incredible%203D%20object%20using%20Metakraft%20AI.%20Click%20the%20link%20to%20behold%20this%20marvel%20or%20unleash%20your%20creativity%20and%20design%20your%20own!%20%40TheMetakraft%20%20Preview%20link%20of%20Metakraft%20Model%20here%3A%20${encodeURI(`${window.location.origin}/model-viewer?id=${id}`)}%20%23MetakraftAI%20%233DGenAI%20%233DCreation`,
                        "__blank",
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
                <Button
                    fullWidth
                    startIcon={!copied && <Share />}
                    endIcon={copied && <Check />}
                    onClick={copy}
                    size="small"
                    variant="outlined"
                >
                    {copied ? "Copied" : "Copy Link"}
                </Button>
            </Box>
        </Menu>
    );
}
