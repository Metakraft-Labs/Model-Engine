import { Box, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import ConnectWallet from "../../components/ConnectWallet";
import StyledModal from "../../components/Modal";

export default function MetaKeepModal({ openMetaKeep, setOpenMetaKeep, setConnected }) {
    const [contract, setContract] = useState(null);
    const [metakeepLoading, setMetakeepLoading] = useState(false);

    useEffect(() => {
        if (contract) {
            setOpenMetaKeep(false);
            if (contract !== null) {
                setConnected(true);
            } else {
                setConnected(false);
            }
        }
    }, [contract]);

    const handleSubmit = async message => {
        setMetakeepLoading(true);

        const contract = await ConnectWallet(message);
        console.log("The contract has", contract);
        setContract(contract);

        setMetakeepLoading(false);
    };

    return (
        <StyledModal open={openMetaKeep} onClose={() => setOpenMetaKeep(false)} heading={"Login"}>
            <Box display={"flex"} flexDirection={"column"} gap={"10px"} width={"100%"}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth={false}
                    disabled={metakeepLoading}
                    onClick={() => handleSubmit("metamask")}
                >
                    Metamask
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth={false}
                    disabled={metakeepLoading}
                    onClick={() => handleSubmit("metakeep")}
                >
                    MetaKeep
                </Button>
            </Box>
        </StyledModal>
    );
}
