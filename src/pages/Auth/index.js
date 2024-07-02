import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Link, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import metakraft from "../../assets/img/login/metakraft.png";
import useConnectWallet from "../../hooks/useConnectWallet";
import Title from "../../shared/Title";
import { AvatarImage, BackLink, Background, CustomButton, FormContainer } from "./styles";

export default function Auth() {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const { connectWallet } = useConnectWallet();
    const [loginLoading, setLoginLoading] = React.useState(false);

    const loginModal = async () => {
        setLoginLoading(true);

        await connectWallet({ emailAddress: email });

        setLoginLoading(false);

        if (location.pathname === "/login") {
            navigate("/");
        }
    };

    return (
        <>
            <Title title={"Login"} />
            <Background>
                <BackLink to="/">
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <ArrowBackIosNewIcon
                            sx={{
                                fontSize: 15,
                            }}
                        />
                        <Typography variant="body2" component="h1" color="#898A8C">
                            Back to Homepage
                        </Typography>
                    </Box>
                </BackLink>
                <Box sx={{ pl: 22 }}>
                    <FormContainer>
                        <AvatarImage src={metakraft} alt="metakraft" />
                        <Typography variant="h6" component="h1" color="white" gutterBottom>
                            Welcome to Spark AI
                        </Typography>
                        <Typography variant="caption" component="h1" color="#898A8C" gutterBottom>
                            Enter your email to get started.
                        </Typography>
                        <TextField
                            sx={{
                                background: "#141414",
                                borderRadius: 3,
                                borderColor: "#303134",
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        borderColor: "#303134", // Default border color
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#303134", // Focused border color
                                    },
                                },
                            }}
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            InputLabelProps={{
                                style: {
                                    color: "#49494B",
                                    border: 5,
                                    borderRadius: 12,
                                    borderColor: "#303134",
                                },
                            }}
                            InputProps={{
                                style: {
                                    color: "#3B3C3F",
                                    border: 5,
                                    borderRadius: 12,
                                    borderColor: "#303134",
                                },
                            }}
                        />
                        <CustomButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={loginModal}
                            disabled={loginLoading}
                        >
                            Continue
                        </CustomButton>

                        <Typography variant="body2" color="white" align="center" marginTop="20px">
                            By continuing, you agree to our{" "}
                            <Link href="#" color="inherit" underline="always">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="#" color="inherit" underline="always">
                                Privacy Policy
                            </Link>
                            .
                        </Typography>
                    </FormContainer>
                </Box>
            </Background>
        </>
    );
}
