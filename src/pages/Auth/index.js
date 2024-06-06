import { Box, Button, Typography } from "@mui/material";
import React from "react";
import useConnectWallet from "../../hooks/useConnectWallet";
import Title from "../../shared/Title";

export default function Auth() {
    const { connectWallet } = useConnectWallet();
    const [loginLoading, setLoginLoading] = React.useState(false);

    const loginModal = async () => {
        setLoginLoading(true);

        await connectWallet();

        setLoginLoading(false);
    };

    return (
        <>
            <Title title={""} />

            <Box
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
            </Box>
        </>
    );
}
