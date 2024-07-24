import { Box, Divider, Typography } from "@mui/material";
import React from "react";
import t23 from "../../../assets/img/dashboard/t23.png";
import zap from "../../../assets/img/dashboard/zap.png";

export default function Text23D({ selectedTab, setTab }) {
    return (
        <Box
            sx={{
                backgroundColor: "#101111",
                backgroundImage: `url(${t23})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
                borderRadius: 7,
                border: `1px solid ${selectedTab === "3d" ? "#E18BFF" : "#373737"}`,
                width: "25%",
                alignItems: "center",
                overflow: "hidden",
                boxShadow: "0px 0px 0px 3px rgba(0, 0, 0, 1)",
                cursor: "pointer",
            }}
            onClick={() => setTab("3d")}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    px: 3,
                    pt: 3,
                    pb: 3,
                    overflowY: "auto",
                    height: "445px",
                    "&::-webkit-scrollbar": {
                        width: "0.4em",
                    },
                    "&::-webkit-scrollbar-track": {
                        boxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
                        webkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0)",
                        outline: "1px solid slategrey",
                        borderRadius: "8px",
                    },
                }}
            >
                <Box>
                    <img style={{ width: "24px", height: "26px" }} src={zap} alt="zap" />
                    <Typography sx={{ fontSize: "18px", mt: 0.8, mb: 0.5 }}>
                        Text/Sketch to 3D
                    </Typography>
                    <Typography color="#9f9f9f" sx={{ fontSize: "16px", pr: 2, mb: 0.8 }}>
                        Start with a Prompt or Sketch to Generate a 3D Model
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "#1e1f1f",
                            display: "flex",
                            flexDirection: "column",
                            textTransform: "none",
                            textAlign: "left",
                            alignItems: "left",
                            justifyContent: "left",
                            border: 1,
                            borderColor: "#373737",
                            borderRadius: 2,
                            p: 1,
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "row" }}>
                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{
                                    background: "#ff5029",
                                    width: "2px",
                                    boxShadow: "0px 0px 1px 1px rgba(255, 80, 41, 0.3)",
                                    borderRadius: "8px",
                                }}
                            />
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "left",
                                    p: 1,
                                }}
                            >
                                <Typography color="white" sx={{ fontSize: "13px" }}>
                                    Start with a Text
                                </Typography>

                                <Typography color="#787878" sx={{ fontSize: "14px" }}>
                                    1 $KRAFT
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: "#1e1f1f",
                            display: "flex",
                            flexDirection: "column",
                            textTransform: "none",
                            textAlign: "left",
                            alignItems: "left",
                            justifyContent: "left",
                            border: 1,
                            borderColor: "#373737",
                            borderRadius: 2,
                            p: 1,
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "row" }}>
                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{
                                    background: "#61FF29",
                                    width: "2px",
                                    boxShadow: "0px 0px 1px 1px rgba(255, 80, 41, 0.3)",
                                    borderRadius: "8px",
                                }}
                            />
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "left",
                                    p: 1,
                                }}
                            >
                                <Typography color="white" sx={{ fontSize: "13px" }}>
                                    Start with an Image
                                </Typography>

                                <Typography color="#787878" sx={{ fontSize: "14px" }}>
                                    5 $KRAFT
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: "#1e1f1f",
                            display: "flex",
                            flexDirection: "column",
                            textTransform: "none",
                            textAlign: "left",
                            alignItems: "left",
                            justifyContent: "left",
                            border: 1,
                            borderColor: "#373737",
                            borderRadius: 2,
                            p: 1,
                        }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "row" }}>
                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{
                                    background: "#ee29ff",
                                    width: "2px",
                                    boxShadow: "0px 0px 1px 1px rgba(238, 41, 255, 0.3)",
                                    borderRadius: "8px",
                                }}
                            />
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "left",
                                    p: 1,
                                }}
                            >
                                <Typography color="white" sx={{ fontSize: "13px" }}>
                                    Export in obj, glb and other formats
                                </Typography>
                                <Typography color="#787878" sx={{ fontSize: "14px" }}>
                                    Free
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
