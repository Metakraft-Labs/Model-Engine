import { Box, Typography } from "@mui/material";
import React from "react";
import skull from "../../../assets/img/dashboard/skull.png";
import zap from "../../../assets/img/dashboard/zap.png";

export default function SceneEditor({ setTab, selectedTab }) {
    return (
        <Box
            sx={{
                backgroundColor: "#101111",
                borderRadius: 7,
                border: `1px solid ${selectedTab === "sceneEditor" ? "#E18BFF" : "#373737"}`,
                textAlign: "center",
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                width: "33%",
                height: "220px",
                backgroundPosition: "top right",
                overflow: "hidden",
                boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                cursor: "pointer",
            }}
            onClick={() => setTab("sceneEditor")}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${skull})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "top right",
                    backgroundSize: "contain",
                    overflow: "hidden",
                }}
            >
                <Box sx={{ px: 2, pt: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                        }}
                    >
                        <img
                            style={{
                                width: "24px",
                                height: "26px",
                            }}
                            src={zap}
                            alt="zap"
                        ></img>
                        <Typography
                            sx={{
                                textAlign: "left",
                                ml: 0.5,
                                fontSize: "18px",
                            }}
                        >
                            Scene Editor
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            textAlign: "left",
                            width: "55%",
                            pl: 1,
                            py: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "14px",
                                lineHeight: 1.2,
                            }}
                            color="#787878"
                        >
                            Create immersive 3D scenes with our Editor
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
