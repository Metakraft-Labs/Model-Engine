import { Box, Drawer, List, Toolbar, Typography } from "@mui/material";
import React from "react";
import { FaCube } from "react-icons/fa";
import logo from "../../assets/img/logo.jpg";
import StyledList from "../List";

export default function LeftNav() {
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
                            selected: window?.location.pathname === "/text-2-3d",
                        },
                    ]}
                />
            </Box>
        </Drawer>
    );
}
