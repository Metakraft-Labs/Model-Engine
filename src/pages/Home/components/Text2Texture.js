import { Box, Typography } from "@mui/material";
import React from "react";
import texture_bg from "../../../assets/img/dashboard/textures_bg.png";
import zap from "../../../assets/img/dashboard/zap.png";

export default function Text2Texture({ selectedTab, setTab }) {
    return (
        <Box
            sx={{
                backgroundColor: "#101111",
                border: `1px solid ${selectedTab === "texture" ? "#E18BFF" : "#373737"}`,
                borderRadius: 7,
                alignItems: "top",
                overflow: "hidden",
                textAlign: "center",
                width: "67%",
                height: "220px",
                display: "flex",
                flexDirection: "column",
                backgroundImage: `url(${texture_bg})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "top right",
                backgroundSize: "contain",
                boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                cursor: "pointer",
            }}
            onClick={() => setTab("texture")}
        >
            <Box sx={{ pl: 2, pt: 3 }}>
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
                    />
                    <Typography
                        sx={{
                            textAlign: "left",
                            fontSize: "18px",
                            ml: 0.5,
                        }}
                    >
                        Generate Textures
                    </Typography>
                </Box>
                <Box
                    sx={{
                        textAlign: "left",
                        width: "32%",
                        alignItems: "top",
                        justifyContent: "left",
                        pt: 1,
                        pb: 7.5,
                    }}
                >
                    <Typography sx={{ fontSize: "14px" }} color="#787878">
                        following different patterns or with just a Sktech
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
