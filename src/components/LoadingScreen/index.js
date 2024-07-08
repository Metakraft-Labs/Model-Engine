import { Box } from "@mui/material";
import React from "react";
import Lottie from "react-lottie";
import bg from "../../assets/img/text-2-3d/bg.svg";
import * as loadingData from "../../assets/lottie/loader.json";

export default function LoadingScreen() {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: loadingData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };
    return (
        <Box
            height={"100vh"}
            width={"100%"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            sx={{
                backgroundColor: "#11141D",
                backgroundImage: `url(${bg})`, // Replace with your image URLs
                backgroundSize: "cover", // First image covers the box, second image is 100x100 pixels
                backgroundRepeat: "no-repeat", // Prevents repeating
            }}
        >
            <Lottie options={defaultOptions} height={400} width={400} />
        </Box>
    );
}
