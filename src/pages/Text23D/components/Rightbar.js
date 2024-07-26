import { Box, Button, IconButton, Typography } from "@mui/material";
import React, { useState } from "react";
import { BsChevronDoubleLeft, BsChevronDoubleRight } from "react-icons/bs";
import dive from "../../../assets/img/text-2-3d/dive.svg";
import lego from "../../../assets/img/text-2-3d/lego.svg";
import run from "../../../assets/img/text-2-3d/run.svg";
import voronoi from "../../../assets/img/text-2-3d/voronoi.svg";
import voxelize from "../../../assets/img/text-2-3d/voxelize.svg";
import walk from "../../../assets/img/text-2-3d/walk.svg";
import { CoinIcon } from "../../../icons/CoinIcon";

export default function Rightbar({
    riggedModel,
    refinedModel,
    loading,
    refineModel,
    stylizeModel,
    rigModel,
    animateModel,
}) {
    const [showRightInputBox, setShowRightInputBox] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [selectedAnimation, setSelectedAnimation] = useState("");

    return (
        <>
            <Box
                height="580px"
                display={showRightInputBox ? "flex" : "none"}
                flexDirection={"column"}
                width={"300px"}
                gap={"20px"}
                sx={{
                    zIndex: 99,
                }}
            >
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    gap={"20px"}
                    borderRadius={"23px"}
                    border={"1px solid #494949"}
                    padding={"23px 17px 23px 17px"}
                    sx={{
                        backgroundColor: "#000000",
                    }}
                >
                    <Box
                        display={"flex"}
                        gap={"10px"}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                    >
                        <Typography fontWeight={400} color={"#737373"} fontSize={"16px"}>
                            Stylize
                        </Typography>
                        <IconButton
                            sx={{ color: "#737373", padding: 0 }}
                            onClick={() => setShowRightInputBox(false)}
                        >
                            <BsChevronDoubleRight />
                        </IconButton>
                    </Box>
                    <Box display={"flex"} justifyContent={"space-around"} alignItems={"center"}>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedStyle(s => (s === "lego" ? "" : "lego"))}
                        >
                            <img
                                src={lego}
                                alt={"right-bar-lego-option-image"}
                                style={{
                                    border: selectedStyle === "lego" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Lego
                            </Typography>
                            <Box display={"flex"} alignItems={"center"} gap={"5px"}>
                                <CoinIcon width="13" height="14" />
                                <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                    30
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedStyle(s => (s === "voxel" ? "" : "voxel"))}
                        >
                            <img
                                src={voxelize}
                                alt={"right-bar-voxel-option-image"}
                                style={{
                                    border:
                                        selectedStyle === "voxel" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Voxelize
                            </Typography>
                            <Box display={"flex"} alignItems={"center"} gap={"5px"}>
                                <CoinIcon width="13" height="14" />
                                <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                    30
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() =>
                                setSelectedStyle(s => (s === "voronoi" ? "" : "voronoi"))
                            }
                        >
                            <img
                                src={voronoi}
                                alt={"right-bar-voronoi-option-image"}
                                style={{
                                    border:
                                        selectedStyle === "voronoi" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Voronoi
                            </Typography>
                            <Box display={"flex"} alignItems={"center"} gap={"5px"}>
                                <CoinIcon width="13" height="14" />
                                <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                    30
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    {selectedStyle && (
                        <Button
                            variant="contained"
                            color={"secondary"}
                            sx={{
                                borderRadius: "20px",
                                "&.Mui-disabled": {
                                    color: "#FFFFFF",
                                    border: "1px solid #4E3562",
                                },
                            }}
                            disabled={loading}
                            onClick={e => stylizeModel(e, selectedStyle)}
                        >
                            Stylize
                        </Button>
                    )}
                </Box>
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    gap={"20px"}
                    borderRadius={"23px"}
                    border={"1px solid #494949"}
                    padding={"23px 17px 23px 17px"}
                    sx={{
                        backgroundColor: "#000000",
                    }}
                >
                    <Typography fontWeight={400} color={"#737373"} fontSize={"16px"}>
                        Rigging & Animation
                    </Typography>
                    <Box display={"flex"} justifyContent={"space-around"} alignItems={"center"}>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedAnimation(s => (s === "walk" ? "" : "walk"))}
                        >
                            <img
                                src={walk}
                                alt={"right-bar-walk-option-image"}
                                style={{
                                    border:
                                        selectedAnimation === "walk" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Walk
                            </Typography>
                        </Box>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedAnimation(s => (s === "run" ? "" : "run"))}
                        >
                            <img
                                src={run}
                                alt={"right-bar-run-option-image"}
                                style={{
                                    border:
                                        selectedAnimation === "run" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Run
                            </Typography>
                        </Box>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"10px"}
                            alignItems={"center"}
                            sx={{
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedAnimation(s => (s === "dive" ? "" : "dive"))}
                        >
                            <img
                                src={dive}
                                alt={"right-bar-dive-option-image"}
                                style={{
                                    border:
                                        selectedAnimation === "dive" ? "1px solid #E18BFF" : "none",
                                    borderRadius: "7px",
                                }}
                            />
                            <Typography fontWeight={600} color={"#737373"} fontSize={"14px"}>
                                Dive
                            </Typography>
                        </Box>
                    </Box>
                    {selectedAnimation && riggedModel && (
                        <Button
                            variant="contained"
                            color={"secondary"}
                            sx={{
                                borderRadius: "20px",
                                "&.Mui-disabled": {
                                    color: "#FFFFFF",
                                    border: "1px solid #4E3562",
                                },
                            }}
                            disabled={loading}
                            onClick={e => animateModel(e, selectedAnimation)}
                        >
                            Animate
                            <Box display={"flex"} alignItems={"center"} gap={"5px"} ml={"10px"}>
                                <CoinIcon width="13" height="14" />
                                <Typography fontWeight={600} color={"#FFFFFF"} fontSize={"14px"}>
                                    50
                                </Typography>
                            </Box>
                        </Button>
                    )}
                    {!riggedModel && (
                        <Button
                            variant="contained"
                            color={"secondary"}
                            sx={{
                                borderRadius: "20px",
                                "&.Mui-disabled": {
                                    color: "#FFFFFF",
                                    border: "1px solid #4E3562",
                                },
                            }}
                            disabled={loading}
                            onClick={rigModel}
                        >
                            Rig
                            <Box display={"flex"} alignItems={"center"} gap={"5px"} ml={"10px"}>
                                <CoinIcon width="13" height="14" />
                                <Typography fontWeight={600} color={"#FFFFFF"} fontSize={"14px"}>
                                    40
                                </Typography>
                            </Box>
                        </Button>
                    )}
                </Box>
                {!refinedModel && (
                    <Button
                        variant="contained"
                        color={"secondary"}
                        sx={{
                            borderRadius: "20px",
                            "&.Mui-disabled": {
                                color: "#FFFFFF",
                                border: "1px solid #4E3562",
                            },
                        }}
                        disabled={loading}
                        onClick={refineModel}
                    >
                        Refine
                        <Box display={"flex"} alignItems={"center"} gap={"5px"} ml={"10px"}>
                            <CoinIcon width="13" height="14" />
                            <Typography fontWeight={600} color={"#FFFFFF"} fontSize={"14px"}>
                                40
                            </Typography>
                        </Box>
                    </Button>
                )}
            </Box>
            <Box
                sx={{
                    display: showRightInputBox ? "none" : "block",
                    background: "#b054f8",
                    mr: -4,
                    padding: "10px",
                    mt: 20,
                    zIndex: 99,
                }}
            >
                <IconButton
                    sx={{ color: "#FFFFFF", padding: 0 }}
                    onClick={() => setShowRightInputBox(true)}
                >
                    <BsChevronDoubleLeft />
                </IconButton>
            </Box>
        </>
    );
}
