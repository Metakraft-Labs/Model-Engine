import { Avatar, Box, Button, Divider, ThemeProvider, Typography } from "@mui/material";
import React from "react";

import astro from "../../assets/img/dashboard/astro.png";
import skull from "../../assets/img/dashboard/skull.png";
// import { useNavigate } from "react-router-dom";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import { createTheme } from "@mui/material";
import footerimg from "../../assets/img/dashboard/footerimg.png";
import footerimg_motion from "../../assets/img/dashboard/footerimg_motion.png";
import gradright from "../../assets/img/dashboard/gradright.png";
import gradtop from "../../assets/img/dashboard/gradtop.png";
import memoji1 from "../../assets/img/dashboard/memoji1.png";
import memoji2 from "../../assets/img/dashboard/memoji2.png";
import memoji3 from "../../assets/img/dashboard/memoji3.png";
import memoji4 from "../../assets/img/dashboard/memoji4.png";
import t23 from "../../assets/img/dashboard/t23.png";
import texture_bg from "../../assets/img/dashboard/textures_bg.png";
import zap from "../../assets/img/dashboard/zap.png";
import Title from "../../shared/Title";
import Navbar from "./Navbar";

export default function Home() {
    // const navigate = useNavigate();
    const theme = createTheme({
        palette: {
            primary: {
                main: "#787878",
            },
        },
    });

    return (
        <>
            <Title title={"Home"} />
            <ThemeProvider theme={theme}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        pt: 6,
                        pb: 8,
                        gap: 0.8,
                        backgroundColor: "#11141D",
                        color: "white",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundImage: `url(${gradtop}), url(${gradright})`, // Replace with your image URLs
                        backgroundPosition: "top left, bottom right", // Positions
                        backgroundSize: "cover, cover", // First image covers the box, second image is 100x100 pixels
                        backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
                    }}
                >
                    <Navbar />
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            pt: 6,
                            pb: 1,
                            width: "80%",
                            height: "75%",
                            gap: 4,
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "#101111",
                                backgroundImage: `url(${t23})`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                                borderRadius: 7,
                                border: 1,
                                borderColor: "#373737",
                                width: "25%",
                                height: "100%",
                                alignItems: "center",
                                overflow: "hidden",
                                boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    px: 3,
                                    pt: 3,
                                    pb: 17.5,
                                }}
                            >
                                <Box>
                                    <img
                                        style={{ width: "24px", height: "26px" }}
                                        src={zap}
                                        alt="zap"
                                    />
                                    <Typography sx={{ fontSize: "18px", mt: 0.8, mb: 0.5 }}>
                                        Text/Sketch to 3D
                                    </Typography>
                                    <Typography
                                        color="#9f9f9f"
                                        sx={{ fontSize: "16px", pr: 2, mb: 0.8 }}
                                    >
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
                                                    boxShadow:
                                                        "0px 0px 1px 1px rgba(255, 80, 41, 0.3)",
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

                                                <Typography
                                                    color="#787878"
                                                    sx={{ fontSize: "14px" }}
                                                >
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
                                                    background: "#ee29ff",
                                                    width: "2px",
                                                    boxShadow:
                                                        "0px 0px 1px 1px rgba(238, 41, 255, 0.3)",
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
                                                    Export in fbx, obj, glb, gltf
                                                </Typography>
                                                <Typography
                                                    color="#787878"
                                                    sx={{ fontSize: "14px" }}
                                                >
                                                    2 $KRAFT
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                width: "75%",
                                height: "100%",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 4,
                                    width: "100%",
                                    height: "50%",
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: "#101111",
                                        borderRadius: 7,
                                        border: 1,
                                        borderColor: "#373737",
                                        pl: 2.5,
                                        py: 3,
                                        width: "50%",
                                        height: "100%",
                                        boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        style={{ width: "24px", height: "26px" }}
                                        src={zap}
                                        alt="zap"
                                    />

                                    <Typography sx={{ fontSize: "18px", mt: 0.8, mb: 0.5 }}>
                                        Invite family, friends, anyone
                                    </Typography>
                                    <Typography sx={{ fontSize: "16px", mb: 0.8 }} color="#787878">
                                        Invite family, friends or others to earn KRAFT
                                    </Typography>
                                    <Box sx={{ mt: 2, display: "flex" }}>
                                        <Avatar
                                            src={memoji1}
                                            sx={{ mx: 2, width: 48, height: 48 }}
                                        />
                                        <Avatar
                                            src={memoji2}
                                            sx={{ mx: -3, width: 48, height: 48 }}
                                        />
                                        <Avatar
                                            src={memoji3}
                                            sx={{ mx: 2, width: 48, height: 48 }}
                                        />
                                        <Avatar
                                            src={memoji4}
                                            sx={{ mx: -3, width: 48, height: 48 }}
                                        />
                                    </Box>
                                    <Button
                                        fullWidth
                                        variant="text"
                                        sx={{
                                            mt: 2,

                                            width: "95%",
                                            backgroundColor: "#1e1f1f",
                                            borderRadius: "500px",
                                            textTransform: "none",
                                        }}
                                    >
                                        <Typography
                                            color="white"
                                            sx={{ fontSize: "18px", mt: 0.8, mb: 0.8 }}
                                        >
                                            Invite
                                        </Typography>
                                    </Button>
                                </Box>

                                <Box
                                    sx={{
                                        backgroundColor: "#101111",
                                        borderRadius: 7,
                                        border: 1,
                                        borderColor: "#373737",
                                        textAlign: "center",
                                        // justifyContent: "left",
                                        dispaly: "flex",
                                        backgroundImage: `url(${astro}) `,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "center",
                                        backgroundSize: "cover",
                                        overflow: "hidden",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "50%",
                                        height: "100%",
                                        boxShadow: " 0px 0px 0px 6px rgba(0, 0, 0, 1)",
                                        pt: 21,
                                        pl: 2,
                                        pb: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            justifyContent: "center", // Center the icon horizontally within the child Box
                                            alignItems: "center", // Center the icon vertically within the child Box
                                            background:
                                                "linear-gradient(to bottom, rgba(27, 28, 31, 0.7), rgba(35, 38, 40, 0.7))",
                                            width: "14%",
                                            p: 1.5,
                                            display: "flex",
                                            flexWrap: "wrap",
                                            border: 1,
                                            borderColor: "#2d2e31", //linear-gradient(to top, rgba(45, 46, 49,1), rgba(45, 46, 49,1))
                                            borderRadius: 6,
                                            // Height of the child Box
                                        }}
                                    >
                                        <PlayCircleFilledRoundedIcon
                                            sx={{
                                                fontSize: 50,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 4,
                                    width: "100%",
                                    height: "50%",
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: "#101111",
                                        borderRadius: 7,
                                        border: 1,
                                        borderColor: "#373737",
                                        textAlign: "center",
                                        alignItems: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "33%",
                                        height: "100%",
                                        backgroundPosition: "top right",
                                        overflow: "hidden",
                                        boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                                    }}
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
                                                    Text to Motion
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
                                                        //mt: 1.5,
                                                        // ml: 2.5,
                                                        // mb: 2.25,

                                                        fontSize: "14px",
                                                        lineHeight: 1.2,
                                                    }}
                                                    color="#787878"
                                                >
                                                    Create Motion from text or with your pre made
                                                    avatars
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box
                                        sx={{
                                            backgroundImage: `url(${footerimg_motion}) `,
                                            backgroundRepeat: "no-repeat",
                                            backgroundPosition: "center",
                                            backgroundSize: "cover",
                                            width: "100%",
                                            height: "10%",
                                            p: 0.5,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {/* <img src={b1}></img> */}
                                        <Typography
                                            textAlign="left"
                                            sx={{ fontSize: "13px", fontWeight: "800", pl: 3 }}
                                        >
                                            coming soon
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box
                                    sx={{
                                        backgroundColor: "#101111",
                                        border: 1,
                                        borderColor: "#373737",
                                        borderRadius: 7,
                                        alignItems: "top",
                                        overflow: "hidden",
                                        textAlign: "center",
                                        width: "67%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        backgroundImage: `url(${texture_bg})`,
                                        backgroundRepeat: "no-repeat",
                                        backgroundPosition: "top right",
                                        backgroundSize: "contain",
                                        boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                                    }}
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
                                            ></img>
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
                            </Box>
                        </Box>
                    </Box>
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
                                    <Typography
                                        sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}
                                    >
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
                                    background:
                                        "linear-gradient(to bottom, #9666a2, #d632ff, #9b6da7)",
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
                                    <Typography
                                        sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}
                                    >
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
                                    background:
                                        "linear-gradient(to bottom, #9666a2, #d632ff, #9b6da7)",
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
                                    <Typography
                                        sx={{ textAlign: "left", ml: 0.5, fontSize: "18px" }}
                                    >
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
                                        Assistant to guide you throughout your journey to build your
                                        first 3D product
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
                </Box>
            </ThemeProvider>
        </>
    );
}
