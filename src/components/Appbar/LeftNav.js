import { Box, Divider, Drawer, List, Toolbar, Typography } from "@mui/material";
import React, { useContext } from "react";
import { FaCube, FaRegImage } from "react-icons/fa";
import { MdExitToApp } from "react-icons/md";
import logo from "../../assets/img/logo.jpg";
import UserStore from "../../contexts/UserStore";
import StyledList from "../List";
import { Listitem } from "../List/styles";

export default function LeftNav() {
    const { setToken, setUser, user } = useContext(UserStore);

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: "307px",
                [`& .MuiDrawer-paper`]: {
                    width: "307px",
                    boxSizing: "border-box",
                    border: "none",
                },
                border: "none",
            }}
        >
            <Toolbar />
            <Box
                width={"100%"}
                px={"1rem"}
                display="flex"
                justifyContent={"center"}
                flexDirection={"column"}
            >
                <List sx={{ width: "100%" }}>
                    <Box
                        display="flex"
                        alignItems="center"
                        sx={{
                            width: "100%",
                            height: "100px",
                        }}
                    >
                        <img src={logo} height={"50%"} style={{ borderRadius: "50%" }} />
                        <Box display={"flex"} flexDirection={"column"} width={"100%"}>
                            <Typography variant="h6" sx={{ ml: 2 }}>
                                AI Tools
                            </Typography>
                            <Typography variant="p" color={"#A1824A"} sx={{ ml: 2, width: "100%" }}>
                                Select Feature
                            </Typography>
                        </Box>
                    </Box>
                </List>
                <StyledList
                    items={[
                        {
                            icon: <FaCube size={"24px"} />,
                            text: "Text 2 3D",
                            path: "/text-2-3d",
                        },
                        {
                            icon: <FaRegImage size={"24px"} />,
                            text: "Text 2 Texture",
                            path: "/text-2-texture",
                        },
                    ]}
                />

                {user && (
                    <>
                        <Divider />

                        <List sx={{ width: "100%" }}>
                            <Listitem onClick={logout}>
                                <MdExitToApp size={"24px"} color="#FF0000" />
                                <Typography
                                    variant="p"
                                    fontSize={"16px"}
                                    color={"#FF0000"}
                                    fontWeight={500}
                                >
                                    Logout
                                </Typography>
                            </Listitem>
                        </List>
                    </>
                )}
            </Box>
        </Drawer>
    );
}
