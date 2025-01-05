import { Abstraxion, useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Box, Link, TextField, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getProviderByEmail, getReferrData } from "../../apis/auth";
import metakraft from "../../assets/img/login/metakraft.png";
import { UserStore } from "../../contexts/UserStore";
import useConnectWallet from "../../hooks/useConnectWallet";
import Title from "../../shared/Title";
import ProviderModal from "./ProviderModal";
import { AvatarImage, Background, CustomButton, FormContainer } from "./styles";

export default function Auth() {
    const {
        setContract,
        setUserWallet,
        user,
        userWallet,
        setToken,
        setBalance,
        setChainId,
        setSigner,
        setSkynetBrowserInstance,
    } = useContext(UserStore);
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [showProviderModal, setShowProviderModal] = useState(false);
    const { connectWallet, RenderPrivyOtpModal } = useConnectWallet({
        setContract,
        setUserWallet,
        user,
        setToken,
        setBalance,
        setChainId,
        setSigner,
        setSkynetBrowserInstance,
    });
    const [loginLoading, setLoginLoading] = React.useState(false);
    const [searchParams] = useSearchParams();
    const [referrerData, setReferredData] = React.useState();
    const query = searchParams.get("ref");
    const [, setShow] = useModal();
    const {
        data: { bech32Address },
    } = useAbstraxionAccount();

    useEffect(() => {
        if (location.pathname === "/login" && userlogout && userWallet) {
            navigate("/");
        }
    }, [location, user, userWallet]);

    useEffect(() => {
        if (query) {
            fetchRefererData();
        }
    }, [query]);

    const fetchRefererData = async () => {
        try {
            const data = await getReferrData(query);
            if (data) {
                setReferredData({
                    provider: data.provider,
                    chainId: data.chainId,
                });
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getProvider = async () => {
        setLoginLoading(true);

        const provider = await getProviderByEmail(email);
        if (provider?.provider && provider?.chainId) {
            const data = {
                email: email,
                provider: "xion",
            };
            localStorage.setItem("xionSign", JSON.stringify(data));
            await loginModal(provider.provider, provider.chainId);
        } else {
            setShowProviderModal(true);
        }
    };

    const loginModal = async (provider, chainId, exp_email) => {
        setShowProviderModal(false);
        // console.log("login model email", email, "and", exp_email);

        await connectWallet({
            emailAddress: exp_email ? exp_email : email,
            walletProvider: provider,
            chainId,
        });

        if (location.pathname === "/login" && user && userWallet) {
            navigate("/");
        }
    };

    useEffect(() => {
        // console.log("running use effect");
        const data = JSON.parse(localStorage.getItem("xionSign"));
        // console.log("bech", bech32Address);
        // console.log("data in storage", data);
        if (data && data.email && data.provider == "xion" && bech32Address) {
            // console.log("provider", data.email, data.provider);
            setEmail(data.email);
            loginModal(data.provider, 1337, data.email);
        }
    }, [bech32Address]);

    return (
        <>
            <Title title={"Login"} />
            <Background>
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
                            onClick={getProvider}
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
                {showProviderModal && (
                    <ProviderModal
                        loginModal={loginModal}
                        open={showProviderModal}
                        onClose={() => setShowProviderModal(false)}
                        defaultSelections={referrerData}
                        email={email}
                    />
                )}
                <RenderPrivyOtpModal />
                <Abstraxion
                    onClose={() => setShow(false)}
                    callbackUrl={`${window.location.protocol}//${window.location.host}"`}
                />
            </Background>
        </>
    );
}
