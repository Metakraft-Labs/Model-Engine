import { Toolbar } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { status } from "./apis/auth";
import Routers from "./common/Routers";
import Appbar from "./components/Appbar";
import UserStore from "./contexts/UserStore";

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
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
        if (token) {
            const res = await status();
            if (res) {
                setUser(res);
            } else {
                toast.error(`Cannot fetch user`);
            }
        }
    }, [token]);

    useEffect(() => {
        getUser();
    }, [getUser]);

    return (
        <UserStore.Provider value={{ theme, setTheme, token, setToken, user, setUser }}>
            <BrowserRouter>
                <ThemeProvider theme={theme === "dark" ? darkTheme : lightTheme}>
                    <Appbar />
                    <Toolbar />
                    <Routers />

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
