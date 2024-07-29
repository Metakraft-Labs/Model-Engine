import { Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PrivyProvider } from "@privy-io/react-auth";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { status } from "./apis/auth";
import logo from "./assets/img/logo.jpg";
import Routers from "./common/Routers";
import LoadingScreen from "./components/LoadingScreen";
import UserStore from "./contexts/UserStore";
import useConnectWallet from "./hooks/useConnectWallet";

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [connected, setConnected] = useState(false);
    const [userWallet, setUserWallet] = useState(null);
    const [signer, setSigner] = useState(null);
    const [balance, setBalance] = useState(0);
    const [chainId, setChainId] = useState(0);
    const { connectWallet } = useConnectWallet({
        setContract,
        setUserWallet,
        user,
        setToken,
        setBalance,
        setChainId,
        setSigner,
    });

    const lightTheme = createTheme({
        palette: {
            background: {
                default: "#F5F5F5",
            },
            text: {
                primary: "#000000",
            },
        },
    });

    const darkTheme = createTheme({
        palette: {
            primary: {
                main: "#787878",
            },
        },
    });

    const getUser = useCallback(async () => {
        setLoading(true);
        if (token) {
            const res = await status();
            if (res) {
                setUser(res);
                await connectWallet({
                    emailAddress: res?.email,
                    auth: false,
                    walletProvider: res?.provider,
                });
            } else {
                toast.error(`Cannot fetch user`);
            }
        }
        setLoading(false);
    }, [token]);

    const updateUser = async () => {
        const res = await status();
        if (res) {
            setUser(res);
        } else {
            toast.error(`Cannot fetch user`);
        }
    };

    useEffect(() => {
        getUser();
    }, [getUser]);

    return (
        <UserStore.Provider
            value={{
                theme,
                setTheme,
                token,
                setToken,
                user,
                setUser,
                contract,
                setContract,
                userWallet,
                setUserWallet,
                connected,
                setConnected,
                balance,
                setBalance,
                chainId,
                setChainId,
                updateUser,
                signer,
                setSigner,
            }}
        >
            <BrowserRouter>
                <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
                    <PrivyProvider
                        appId={process.env.REACT_APP_PRIVY_APP_ID}
                        config={{
                            loginMethods: ["email"],
                            appearance: {
                                theme: "light",
                                accentColor: "#676FFF",
                                logo: logo,
                            },
                            embeddedWallets: {
                                createOnLogin: "users-without-wallets",
                            },
                        }}
                    >
                        <Box sx={{ display: "flex" }}>
                            {loading ? <LoadingScreen /> : <Routers />}
                        </Box>

                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme={theme}
                        />
                    </PrivyProvider>
                </ThemeProvider>
            </BrowserRouter>
        </UserStore.Provider>
    );
}

export default App;
