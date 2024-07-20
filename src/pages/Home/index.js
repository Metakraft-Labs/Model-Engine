import { Box } from "@mui/material";
import React from "react";
import gradright from "../../assets/img/dashboard/gradright.png";
import gradtop from "../../assets/img/dashboard/gradtop.png";
import Title from "../../shared/Title";
import Footer from "./components/Footer";
import Invite from "./components/Invite";
import Navbar from "./components/Navbar";
import Text23D from "./components/Text23D";
import Text2Motion from "./components/Text2Motion";
import Text2Texture from "./components/Text2Texture";
import VideoBox from "./components/VideoBox";

export default function Home() {
    const [selectedTab, setSelectedTab] = React.useState(null);

    const setTab = tab => {
        setSelectedTab(t => (t === tab ? null : tab));
    };

    return (
        <>
            <Title title={"Home"} />
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
                    minHeight: "100dvh",
                    maxHeight: "auto",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundImage: `url(${gradtop}), url(${gradright})`, // Replace with your image URLs
                    backgroundPosition: "top left, bottom right", // Positions
                    backgroundSize: "cover, cover", // First image covers the box, second image is 100x100 pixels
                    backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
                }}
            >
                <Navbar selectedTab={selectedTab} />
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
                    <Text23D selectedTab={selectedTab} setTab={setTab} />

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
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
                            <Invite />

                            <VideoBox />
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
                            <Text2Motion />

                            <Text2Texture selectedTab={selectedTab} setTab={setTab} />
                        </Box>
                    </Box>
                </Box>
                <Footer />
            </Box>
        </>
    );
}
