import { Box } from "@mui/material";
import React from "react";
import ball from "../../assets/img/login/ball.png";
import bg_avatar from "../../assets/img/login/bg_avatar.png";
//import useConnectWallet from "../../hooks/useConnectWallet";
import Title from "../../shared/Title";

export default function Auth() {
    // const { connectWallet } = useConnectWallet();
    // const [loginLoading, setLoginLoading] = React.useState(false);

    // const loginModal = async () => {
    //     setLoginLoading(true);

    //     await connectWallet();

    //     setLoginLoading(false);
    // };

    return (
        <>
            <Title title={""} />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    backgroundColor: "#11141D",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Box
                    sx={{
                        backgroundImage: `url(${ball})`, // Replace with your image URLs
                        backgroundPosition: "bottom left", // Positions
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        width: "50%",
                        height: "100%",
                    }}
                ></Box>
                <Box
                    sx={{
                        backgroundImage: `url(${bg_avatar})`, // Replace with your image URLs
                        backgroundPosition: "bottom right", // Positions
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        width: "50%",
                        height: "100%",
                    }}
                ></Box>
            </Box>

            {/* <Box
                display={"flex"}
                flexDirection={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                height={"200%"}
                gap={"30px"}
            >
                <Typography variant="h4">
                    To use this feature, please authenticate yourself
                </Typography>
                <Box display={"flex"} alignItems={"center"} gap={"30px"}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={loginModal}
                        disabled={loginLoading}
                    >
                        Login
                    </Button>
                </Box>
            </Box> */}
        </>
    );
}
