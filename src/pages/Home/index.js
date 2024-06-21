import {
    AppBar,
    Avatar,
    Box,
    Button,
    CssBaseline,
    Grid,
    ThemeProvider,
    Toolbar,
    Typography,
} from "@mui/material";
import React from "react";

import footerimage from "../../assets/img/realistic_Abstract_4.png";
import spark from "../../assets/img/spark-pngrepo-com 1.png";
import skull from "../../assets/img/Untitled design (39) 1.png";
// import { useNavigate } from "react-router-dom";
import { createTheme } from "@mui/material";
import zap from "../../assets/img/zap.png";
import Title from "../../shared/Title";

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
                {/* <Box sx={{ display: "flex" }}>
                    <CssBaseline />
                    <AppBar
                        component="nav"
                        sx={{
                            borderRadius: 10,
                            p: 0.5,
                            mt: 3,
                            width: "90%",
                            border: "1px solid #37393c",
                            backgroundColor: "#202224",
                            align: "center",
                        }}
                    >
                        <Toolbar>
                            <img src={spark}></img>
                            <Typography variant="body1" sx={{ p: 1 }}>
                                SPARK AI
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </Box> */}
                <Box
                    sx={{
                        paddingTop: 10,
                        pl: 3,
                        pr: 3,
                        pb: 3,
                        backgroundColor: "#11141D",
                        color: "white",
                        minHeight: "100vh",
                        width: "100%",
                    }}
                >
                    {/* <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 4,
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                            SPARK AI
                        </Typography>
                        <IconButton color="primary">
                            <AddCircleOutlineIcon />
                        </IconButton>
                    </Box> */}
                    <Box
                        sx={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <CssBaseline />
                        <AppBar
                            variant="regular"
                            sx={{
                                borderRadius: 10,
                                p: 0.5,
                                mt: 3,
                                width: "90%",
                                border: "1px solid #37393c",
                                backgroundColor: "#202224",
                                align: "center",
                            }}
                        >
                            <Toolbar>
                                <img src={spark}></img>
                                <Typography variant="body1" sx={{ p: 1 }}>
                                    SPARK AI
                                </Typography>
                            </Toolbar>
                        </AppBar>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6} md={3} lg={3}>
                            <Box
                                src="../../assets/img/t23.png"
                                sx={{
                                    backgroundColor: "#101111",
                                    backgroundImage: "url({'../../assets/img/t23.png'})",
                                    backgroundRepeat: "no-repeat",
                                    // height: "409px",
                                    // width: "256px",
                                    borderRadius: 7,
                                    p: 2,
                                }}
                            >
                                <img style={{ padding: 4 }} src={zap} alt="zap"></img>
                                <Typography variant="h6" sx={{ ml: 1, mt: 0.8, mb: 0.5 }}>
                                    Text/Sketch to 3D
                                </Typography>
                                <Typography variant="body1" color="#787878" sx={{ ml: 1, mb: 0.8 }}>
                                    Start with a Prompt or Sketch to Generate a 3D Model
                                </Typography>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    display="block"
                                    color="primary"
                                    sx={{
                                        ml: 1,
                                        mt: 2,
                                        mb: 1,
                                        width: "95%",
                                        backgroundColor: "#1e1f1f",
                                        display: "flex",
                                        flexDirection: "column",
                                        textTransfrom: "none",
                                        textAlign: "left",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "left",
                                        }}
                                    >
                                        <Typography variant="caption" textTransfrom="none">
                                            Start with a Text
                                        </Typography>

                                        <Typography variant="caption" color="#787878">
                                            1 $KRAFT
                                        </Typography>
                                    </Box>
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    display="block"
                                    color="primary"
                                    sx={{
                                        ml: 1,
                                        mt: 2,
                                        mb: 1,
                                        width: "95%",
                                        backgroundColor: "#1e1f1f",
                                        display: "flex",
                                        flexDirection: "column",
                                        textTransfrom: "none",
                                        textAlign: "left",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "left",
                                        }}
                                    >
                                        <Typography variant="caption" textTransfrom="none">
                                            Export in fbx, obj, glb, gltf
                                        </Typography>
                                        <Typography variant="caption" color="#787878">
                                            2 $KRAFT
                                        </Typography>
                                    </Box>
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={6} md={4} lg={4}>
                            <Box
                                boxShadow={3}
                                sx={{
                                    backgroundColor: "#101111",
                                    borderRadius: 7,
                                    BorderColor: "#787878",
                                    p: 2,
                                    // height: "246px",
                                    // width: "392px",
                                }}
                            >
                                <img style={{ padding: 4 }} src={zap} alt="zap"></img>

                                <Typography variant="h6" sx={{ ml: 1, mt: 0.8, mb: 0.5 }}>
                                    Invite family, friends, anyone
                                </Typography>
                                <Typography variant="body1" sx={{ ml: 1, mb: 0.8 }} color="#787878">
                                    Invite family, friends or others to earn KRAFT
                                </Typography>
                                <Box sx={{ ml: 1, mt: 3, display: "flex" }}>
                                    <Avatar src="avatar1.jpg" sx={{ mx: 2 }} />
                                    <Avatar src="avatar2.jpg" sx={{ mx: -2.7 }} />
                                    <Avatar src="avatar3.jpg" sx={{ mx: 2 }} />
                                    <Avatar src="avatar4.jpg" sx={{ mx: -2.7 }} />
                                </Box>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="primary"
                                    sx={{
                                        ml: 1,
                                        mt: 2,
                                        mb: 1,
                                        width: "95%",
                                        backgroundColor: "#1e1f1f",
                                        borderRadius: "500px",
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        textTransfrom="none"
                                        sx={{ mt: 0.8, mb: 0.8 }}
                                    >
                                        Invite
                                    </Typography>
                                </Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4} lg={4}>
                            <Box
                                sx={{
                                    backgroundColor: "#101111",
                                    // width: "392px",
                                    // height: "243px",
                                    borderRadius: 7,
                                    p: 2,
                                }}
                            >
                                <video
                                    src="path/to/image.jpg"
                                    alt="Astronaut"
                                    style={{ width: "392px", height: "243px", borderRadius: 7 }}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3} lg={4}>
                            <Box
                                sx={{
                                    backgroundColor: "#101111",
                                    borderRadius: 7,
                                    p: 2,
                                    textAlign: "center",
                                    // width: "254px",
                                    // height: "147px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Box sx={{ display: "flex", flexDirection: "row" }}>
                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Box sx={{ display: "flex", flexDirection: "row", mt: 2 }}>
                                            <img
                                                style={{
                                                    paddingLeft: 4,
                                                    paddingTop: 4,
                                                    width: "28px",
                                                    height: "28px",
                                                }}
                                                src={zap}
                                                alt="zap"
                                            ></img>
                                            <Typography
                                                variant="h6"
                                                sx={{ textAlign: "left", ml: 0.5 }}
                                            >
                                                Text to Motion
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: "left" }}>
                                            <Typography
                                                variant="body1"
                                                sx={{ ml: 1.5 }}
                                                color="#787878"
                                            >
                                                Create Motion from text or with your pre made
                                                avatars
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                        <img align="right" src={skull} alt="Skeleton" />
                                    </Box>
                                </Box>
                                <Box
                                    sx={{
                                        background: `url(${footerimage})`,
                                    }}
                                >
                                    {/* <img src={b1}></img> */}
                                    <Typography variant="caption">coming soon</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={5} lg={4}>
                            <Box
                                sx={{
                                    backgroundColor: "#101111",
                                    borderRadius: 7,
                                    p: 2,
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h6">Generate Textures</Typography>
                                <img
                                    src="path/to/textures.jpg"
                                    alt="Textures"
                                    style={{ width: "100%", borderRadius: "8px" }}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    backgroundColor: "#101111",
                                    borderRadius: 7,
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 2,
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    textAlign: "center",
                                }}
                            >
                                <Grid container spacing={2} sx={{ p: 2, textAlign: "center" }}>
                                    <Grid item xs={4}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "left",
                                                textAlign: "center",
                                                flexWrap: "wrap",
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
                                                        paddingTop: 4,
                                                        width: "24px",
                                                        height: "28px",
                                                    }}
                                                    src={zap}
                                                    alt="zap"
                                                ></img>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ textAlign: "left", ml: 0.5 }}
                                                >
                                                    Text/Sketch to 3D
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    textAlign: "left",
                                                    justifyContent: "left",
                                                    alignItems: "left",
                                                }}
                                            >
                                                <Typography variant="body1" color="#787878">
                                                    Generate Highly Defined 3D Models
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    {/* <Divider
                                        orientation="vertical"
                                        variant="middle"
                                        color="#9c24fb"
                                        sx={{ color: "#9c24fb" }}
                                    /> */}
                                    <Grid item xs={4}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "left",
                                                flexWrap: "wrap",
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
                                                        paddingTop: 4,
                                                        width: "24px",
                                                        height: "28px",
                                                    }}
                                                    src={zap}
                                                    alt="zap"
                                                ></img>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ textAlign: "left", ml: 0.5 }}
                                                >
                                                    Avatar Generator
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    textAlign: "left",
                                                    justifyContent: "left",
                                                    alignItems: "left",
                                                }}
                                            >
                                                <Typography variant="body1" color="#787878">
                                                    Generate Custom Avatars with simple sketch or
                                                    text
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    {/* <Divider orientation="vertical" variant="middle" flexItem /> */}

                                    <Grid item xs={4}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "left",
                                                flexWrap: "wrap",
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
                                                        paddingTop: 4,
                                                        width: "24px",
                                                        height: "28px",
                                                    }}
                                                    src={zap}
                                                    alt="zap"
                                                ></img>
                                                <Typography
                                                    variant="h6"
                                                    sx={{ textAlign: "left", ml: 0.5 }}
                                                >
                                                    Spark
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    textAlign: "left",
                                                    justifyContent: "left",
                                                    alignItems: "left",
                                                }}
                                            >
                                                <Typography variant="body1" color="#787878">
                                                    Assistant to guide you throughout your journey
                                                    to build your first 3D product
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                                {/* <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={{ xs: 1, sm: 2, md: 4 }}
                                > */}

                                {/* </Stack> */}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                {/* <div className="bg">
                <div className="tgrad"></div>
                <div className="rgrad"></div>

                <div className="navbar">
                    <div>
                        <img style={{ padding: "18px" }} src={spark}></img>
                    </div>
                    <span className="sparkai">SPARK AI</span>
                    <div className="list">
                        <Box
                        bgcolor={}
                            onClick={() => navigate("../User/Nfts")}
                            selected={"../User/Nfts" === window.location.pathname}
                        >
                            My Projects
                        </Box>
                        <Box className="list">Trash</Box>
                        <Box className="list">Analytics</Box>
                    </div>
                    <button className="button">Create File</button>
                    <div className="avatar">
                        <Avatar src={avatar} />
                    </div>
                </div>
            </div> */}
            </ThemeProvider>
        </>
    );
}
