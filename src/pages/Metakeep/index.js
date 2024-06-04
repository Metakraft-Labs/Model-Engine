import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import Title from "../../shared/Title";
import MetaKeepModal from "./Modal";

export default function MetaKeep() {
    const [openMetaKeep, setOpenMetaKeep] = useState(false);
    const [connected, setConnected] = useState(false);

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
                <Typography variant="h4">To use this feature, please connect to Wallet</Typography>
                <Box display={"flex"} alignItems={"center"} gap={"30px"}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenMetaKeep(true)}
                    >
                        {!connected ? <>Connect</> : <>Connected</>}
                    </Button>
                </Box>
            </Box>

            {/* MetaKeep modal */}
            <MetaKeepModal
                openMetaKeep={openMetaKeep}
                setOpenMetaKeep={setOpenMetaKeep}
                setConnected={setConnected}
            />
        </>
    );
}
