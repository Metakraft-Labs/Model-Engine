import { Box, Button, IconButton, MenuItem, Select, Typography } from "@mui/material";
import React, { useState } from "react";
import { BsChevronDoubleLeft, BsChevronDoubleRight } from "react-icons/bs";
import { FaBars } from "react-icons/fa6";
import { RiGalleryFill } from "react-icons/ri";
import lightBulb from "../../../assets/img/text-2-3d/light-bulb.png";
import ImageContent from "./ImageContent";
import TextContent from "./TextContent";

export default function Leftbar({
    model,
    mode,
    quality,
    setMode,
    setQuality,
    prompt,
    setPrompt,
    image,
    setImage,
    loading,
    generateModel,
}) {
    const [showInputBox, setShowInputBox] = useState(true);
    return (
        <>
            <Box
                height="545px"
                display={"flex"}
                flexDirection={"column"}
                border="1px solid #E18BFF"
                width={"374px"}
                borderRadius={"23px"}
                padding={"23px 17px 23px 30px"}
                sx={{
                    zIndex: 99,
                    boxShadow: "0px 0px 0px 3px #000000",
                    backgroundColor: "#000000",
                    backgroundImage: `url(${lightBulb})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    display: showInputBox ? "flex" : "none",
                }}
            >
                <Box display={"flex"} flexDirection={"column"} gap={"20px"} flex={1}>
                    <Box display={"flex"} gap={"10px"} alignItems={"center"}>
                        {model && (
                            <IconButton
                                sx={{ color: "#FFFFFF", padding: 0 }}
                                onClick={() => setShowInputBox(false)}
                            >
                                <BsChevronDoubleLeft />
                            </IconButton>
                        )}
                        <Typography fontWeight={500} fontSize={"18px"}>
                            Generate 3D
                        </Typography>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-around"} alignItems={"center"}>
                        <Box
                            display="flex"
                            gap="3px"
                            alignItems="center"
                            onClick={() => setMode("image")}
                            sx={{ cursor: "pointer" }}
                            color={mode === "image" ? "#FFFFFF" : "#B6B6B6"}
                        >
                            <RiGalleryFill />
                            <Typography>Image to 3D</Typography>
                        </Box>
                        <Box
                            display="flex"
                            gap="3px"
                            alignItems="center"
                            onClick={() => setMode("text")}
                            sx={{ cursor: "pointer" }}
                            color={mode === "text" ? "#FFFFFF" : "#B6B6B6"}
                        >
                            <FaBars />
                            <Typography>Text to 3D</Typography>
                        </Box>
                    </Box>

                    {mode === "text" ? (
                        <TextContent prompt={prompt} setPrompt={setPrompt} />
                    ) : (
                        <ImageContent image={image} setImage={setImage} loading={loading} />
                    )}
                </Box>
                <Box
                    display={"flex"}
                    justifyContent={"space-between"}
                    gap={"10px"}
                    alignItems={"center"}
                >
                    <Select
                        value={quality}
                        onChange={e => setQuality(e.target.value)}
                        sx={{
                            border: "1px solid #B158F6",
                            color: "#FFFFFF",
                        }}
                        size="small"
                    >
                        <MenuItem value={"advanced"}>
                            Quality - Advanced | {mode === "text" ? "20" : "50"} credit
                        </MenuItem>
                    </Select>
                    <Button
                        sx={{
                            backgroundColor: "#B054F8",
                            color: "white",
                            borderRadius: "12px",
                            padding: theme => theme.spacing(1.5, 3),
                            textTransform: "none",
                            "&:hover": {
                                backgroundColor: "#B054F8",
                                boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",
                            },
                        }}
                        onClick={e => generateModel(e)}
                        disabled={
                            (mode === "image" && !image) || (mode === "text" && !prompt) || loading
                        }
                    >
                        Generate
                    </Button>
                </Box>
            </Box>
            <Box
                sx={{
                    display: showInputBox ? "none" : "block",
                    background: "#b054f8",
                    ml: -4,
                    padding: "10px",
                    mt: 20,
                    zIndex: 99,
                }}
            >
                <IconButton
                    sx={{ color: "#FFFFFF", padding: 0 }}
                    onClick={() => setShowInputBox(true)}
                >
                    <BsChevronDoubleRight />
                </IconButton>
            </Box>
        </>
    );
}
