import { Box, Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { login } from "../../apis/auth";
import StyledModal from "../../components/Modal";
import UserStore from "../../contexts/UserStore";

export default function MetaKeepModal({ openMetaKeep, setOpenMetaKeep }) {
    const { setToken, user } = useContext(UserStore);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [metakeepLoading, setMetakeepLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setOpenMetaKeep(false);
        }
    }, [user]);

    const handleSubmit = async e => {
        setMetakeepLoading(true);
        e.preventDefault();
        const res = await login({ email, password });
        if (res) {
            setToken(res);
            localStorage.setItem("token", res);
        }
        setMetakeepLoading(false);
    };

    return (
        <StyledModal open={openMetaKeep} onClose={() => setOpenMetaKeep(false)} heading={"Login"}>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <Box display={"flex"} flexDirection={"column"} gap={"10px"} width={"100%"}>
                    <input
                        type="text"
                        placeholder={"Email"}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{
                            width: "100%",
                            height: "3rem",
                            borderRadius: "10px",
                            padding: "10px",
                        }}
                    />
                    <input
                        type="password"
                        placeholder={"Password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: "100%",
                            height: "3rem",
                            borderRadius: "10px",
                            padding: "10px",
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth={false}
                        disabled={metakeepLoading}
                    >
                        Connect to Wallet
                    </Button>
                </Box>
            </form>
        </StyledModal>
    );
}
