import { Box, Divider, Drawer, List, Toolbar, Tooltip, Typography } from "@mui/material";
import React, { useContext } from "react";
import {} from "react-icons/fa";
import { IoImageOutline } from "react-icons/io5";
import { MdExitToApp } from "react-icons/md";
import { PiCubeFill, PiFramerLogo } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.jpg";
import UserStore from "../../contexts/UserStore";
import { minifyAddress } from "../../shared/web3utils";
import StyledList from "../List";
import { Listitem } from "../List/styles";

export default function LeftNav() {
    const { setToken, setUser, user, userWallet } = useContext(UserStore);
    const [tooltipTitle, setTooltipTitle] = React.useState(userWallet);
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(userWallet);
        setTooltipTitle("Copied to clipboard");
        setTimeout(() => {
            setTooltipTitle(userWallet);
        }, 2000);
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
                            icon: <PiCubeFill size={"24px"} />,
                            text: "Text 2 3D",
                            path: "/text-2-3d",
                        },
                        {
                            icon: <PiFramerLogo size={"24px"} />,
                            text: "Text 2 Motion",
                            path: "/text-2-motion",
                        },
                        {
                            icon: <IoImageOutline size={"24px"} />,
                            text: "Text 2 Texture",
                            path: "/text-2-texture",
                        },
                    ]}
                />

                {user && (
                    <>
                        <Divider />
                        <List sx={{ width: "100%" }}>
                            {userWallet && (
                                <>
                                    <Listitem onClick={copyToClipboard}>
                                        <Tooltip title={tooltipTitle} placement="top">
                                            <Typography
                                                variant="p"
                                                fontSize={"16px"}
                                                color={"#000000"}
                                                fontWeight={500}
                                            >
                                                Wallet: {minifyAddress(userWallet)}
                                            </Typography>
                                        </Tooltip>
                                    </Listitem>
                                    <Listitem onClick={() => navigate("/user/nfts")}>
                                        <Tooltip title={tooltipTitle} placement="top">
                                            <Typography
                                                variant="p"
                                                fontSize={"16px"}
                                                color={"#000000"}
                                                fontWeight={500}
                                            >
                                                Your NFTs
                                            </Typography>
                                        </Tooltip>
                                    </Listitem>
                                </>
                            )}
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
