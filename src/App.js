import { Box, CircularProgress, Toolbar } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { status } from "./apis/auth";
import Routers from "./common/Routers";
import Appbar from "./components/Appbar";
import UserStore from "./contexts/UserStore";
import Auth from "./pages/Auth";

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [connected, setConnected] = useState(false);
    const [userWallet, setUserWallet] = useState(null);

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
            background: {
                default: "#121212",
            },
            text: {
                primary: "#ffffff",
            },
        },
        components: {
            MuiTextField: {
                styleOverrides: {
                    root: {
                        "& label": {
                            color: "#ffffff",
                        },
                        "& .MuiInput-underline:before": {
                            borderBottomColor: "#ffffff",
                        },
                    },
                },
            },
        },
    });

    const getUser = useCallback(async () => {
        setLoading(true);
        if (token) {
            const res = await status();
            if (res) {
                setUser(res);
            } else {
                toast.error(`Cannot fetch user`);
            }
        }
        setLoading(false);
    }, [token]);

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
            }}
        >
            <BrowserRouter>
                <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
                    <Box sx={{ display: "flex" }}>
                        {loading ? (
                            <Box
                                height={"80vh"}
                                width={"100%"}
                                display={"flex"}
                                justifyContent={"center"}
                                alignItems={"center"}
                            >
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Appbar />
                                <Box sx={{ flexGrow: 1, padding: "1rem" }}>
                                    <Toolbar />
                                    {user && userWallet ? <Routers /> : <Auth />}
                                </Box>
                            </>
                        )}
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
        </UserStore.Provider>
    );
}

export default App;
