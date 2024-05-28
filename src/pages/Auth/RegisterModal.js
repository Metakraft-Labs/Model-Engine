import { Box, Button } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { register } from "../../apis/auth";
import StyledModal from "../../components/Modal";
import UserStore from "../../contexts/UserStore";

export default function RegisterModal({ openRegister, setOpenRegister }) {
    const { setToken, user } = useContext(UserStore);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password_confirmation, setPasswordConfirmation] = useState("");
    const [registerLoading, setRegisterLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setOpenRegister(false);
        }
    }, [user]);

    const handleSubmit = async e => {
        setRegisterLoading(true);
        e.preventDefault();
        const res = await register({ email, password, confirm_password: password_confirmation });
        if (res) {
            setToken(res);
            localStorage.setItem("token", res);
        }
        setRegisterLoading(false);
    };

    return (
        <StyledModal
            open={openRegister}
            onClose={() => setOpenRegister(false)}
            heading={"Register"}
        >
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
                    <input
                        type="password"
                        placeholder={"Confirm Password"}
                        value={password_confirmation}
                        onChange={e => setPasswordConfirmation(e.target.value)}
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
                        color="secondary"
                        fullWidth={false}
                        disabled={registerLoading}
                    >
                        Register
                    </Button>
                </Box>
            </form>
        </StyledModal>
    );
}
