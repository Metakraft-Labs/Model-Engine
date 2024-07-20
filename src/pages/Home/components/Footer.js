import { Box, Divider, Typography } from "@mui/material";
import React from "react";
import footerimg from "../../../assets/img/dashboard/footerimg.png";
import zap from "../../../assets/img/dashboard/zap.png";

export default function Footer() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#101111",
                border: 1,
                borderColor: "#373737",
                borderRadius: 7,
                alignItems: "center",
                justifyContent: "center",
                height: "25%",
                width: "80%",
                overflow: "hidden",
                boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    p: 3,
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "center",

                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexWrap: "wrap",
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
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
                        <Typography sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}>
                            Text/Sketch to 3D
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: "50%",
                        }}
                    >
                        <Typography
                            color="#9f9f9f"
                            sx={{
                                fontSize: "16px",
                                textAlign: "center",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            Generate Highly Defined 3D Models
                        </Typography>
                    </Box>
                </Box>
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        background: "linear-gradient(to bottom, #9666a2, #d632ff, #9b6da7)",
                        width: "0.8px",
                    }}
                />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexWrap: "wrap",
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
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
                        <Typography sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}>
                            Avatar Generator
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: "50%",
                        }}
                    >
                        <Typography
                            color="#9f9f9f"
                            sx={{
                                fontSize: "16px",
                                textAlign: "center",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            Generate Custom Avatars with simple sketch or text
                        </Typography>
                    </Box>
                </Box>
                <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                        background: "linear-gradient(to bottom, #9666a2, #d632ff, #9b6da7)",
                        width: "0.8px",
                    }}
                />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flexWrap: "wrap",
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
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
                        <Typography sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}>
                            Spark
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: "80%",
                        }}
                    >
                        <Typography
                            color="#9f9f9f"
                            sx={{
                                fontSize: "16px",
                                textAlign: "center",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            Assistant to guide you throughout your journey to build your first 3D
                            product
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box
                sx={{
                    width: "100%",
                    backgroundImage: `url(${footerimg})`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    p: 0.5,
                }}
            ></Box>
        </Box>
    );
}
