import { Box, Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import useConnectWallet from "../../components/ConnectWallet";
import StyledModal from "../../components/Modal";
import UserStore from "../../contexts/UserStore";

export default function MetaKeepModal({ openMetaKeep, setOpenMetaKeep, setConnected }) {
    const [contract, setContract] = useState(null);
    const [metakeepLoading, setMetakeepLoading] = useState(false);

    const { userWallet } = useContext(UserStore);

    const { connectWallet } = useConnectWallet();
    useEffect(() => {
        if (contract) {
            setOpenMetaKeep(false);
        }

        if (userWallet !== null) {
            setConnected(true);
        } else {
            setConnected(false);
        }
    }, [contract, userWallet]);

    const handleSubmit = async message => {
        setMetakeepLoading(true);

        const contract = await connectWallet(message);
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
