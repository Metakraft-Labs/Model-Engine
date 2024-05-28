import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import Title from "../../shared/Title";
import LoginModal from "./LoginModal";

export default function Auth() {
    const [openLogin, setOpenLogin] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);

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
                    <Button variant="contained" color="primary" onClick={() => setOpenLogin(true)}>
                        Login
                    </Button>
                </Box>
            </Box>

            {/* Login modal */}
            <LoginModal openLogin={openLogin} setOpenLogin={setOpenLogin} />
        </>
    );
}
