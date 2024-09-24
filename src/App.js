import { Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { PrivyProvider } from "@privy-io/react-auth";
import React, { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { defineChain } from "viem";
import logo from "./assets/img/logo.jpg";
import Routers from "./common/Routers";
import LoadingScreen from "./components/LoadingScreen";
import { useThemeProvider } from "./components/scene-editor/services/ThemeService";
import UserProvider from "./contexts/UserStore";
import { createHyperStore } from "./hyperflux";
import { getSupportedChains } from "./shared/web3utils";
import { initializei18n } from "./util";

const publicPath = location.origin;
createHyperStore({ publicPath });
initializei18n();

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
    const [loading, setLoading] = useState(true);

    useThemeProvider();

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
        components: {
            MuiTypography: {
                styleOverrides: {
                    root: {
                        color: "#FFFFFF",
                    },
                },
                defaultProps: {
                    classes:
                        "text-theme-primary text-base font-normal, inline-block leading-normal",
                },
            },
        },
    });

    return (
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
                supportedChains: getSupportedChains().map(c => defineChain(c)),
                defaultChain: getSupportedChains().find(c => c.network === "Berachain"),
            }}
        >
            <UserProvider theme={theme} setTheme={setTheme} setLoading={setLoading}>
                <BrowserRouter>
                    <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
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
                    </ThemeProvider>
                </BrowserRouter>
            </UserProvider>
        </PrivyProvider>
    );
}

export default App;
