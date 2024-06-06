import { Box, Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import UserStore from "../../contexts/UserStore";
import useConnectWallet from "../../hooks/useConnectWallet";
import StyledModal from "../Modal";

export default function MetaKeepModal({ openMetaKeep, setOpenMetaKeep }) {
    const [contract, setContract] = useState(null);
    const [metakeepLoading, setMetakeepLoading] = useState(false);

    const { userWallet, setConnected } = useContext(UserStore);

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

    const handleSubmit = async () => {
        setMetakeepLoading(true);

        const contract = await connectWallet();
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
                    onClick={() => handleSubmit()}
                >
                    MetaKeep
                </Button>
            </Box>
        </StyledModal>
    );
}
