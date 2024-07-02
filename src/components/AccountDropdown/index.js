import { Badge, Box, Button, Menu, Typography } from "@mui/material";
import React, { useContext } from "react";
import { GiSettingsKnobs } from "react-icons/gi";
import { MdOutlineLogout } from "react-icons/md";
import UserStore from "../../contexts/UserStore";
import { useNavigate } from "react-router-dom";

export default function AccountDropdown({ open, handleClose, user }) {
    const navigate = useNavigate();
    const { setToken, setUser } = useContext(UserStore);

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    background: "#000000",
                    color: "#A5A5A5",
                    width: "378px",
                    borderRadius: "6px",
                    border: "1px solid #B158F6",
                    padding: "15px",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
                <Typography fontSize={"18px"} color={"#AAAAAA"}>
                    {user?.email}
                </Typography>
                <Typography fontSize={"18px"} color={"#61BA88"}>
                    Free
                </Typography>
            </Box>
            <Box display={"flex"} mt={"20px"} flexDirection={"column"} gap={"10px"} padding={"8px"}>
                <Button fullWidth sx={{ padding: 0 }} onClick={() => navigate("/user/account")}>
                    <Box
                        display={"flex"}
                        border={"1px solid #492465"}
                        borderRadius={"10px"}
                        padding={"15px 30px"}
                        gap={"8px"}
                        alignItems={"center"}
                        textTransform={"none"}
                        width={"100%"}
                    >
                        <GiSettingsKnobs color="#FFFFFF" size={"18px"} />
                        <Typography fontWeight={400} fontSize={"18px"} color={"#A8A8A8"}>
                            Account Settings
                        </Typography>
                        <Badge
                            sx={{
                                background: "#1C3D3B",
                                border: "1px solid #14544E",
                                borderRadius: "3px",
                                padding: "2px 6px",
                                ml: "10px",
                            }}
                        >
                            <Typography color={"#299A8F"}>API</Typography>
                        </Badge>
                    </Box>
                </Button>
                <Button fullWidth sx={{ padding: 0 }} onClick={logout}>
                    <Box
                        display={"flex"}
                        border={"1px solid #492465"}
                        borderRadius={"10px"}
                        padding={"15px 30px"}
                        gap={"8px"}
                        alignItems={"center"}
                        width={"100%"}
                    >
                        <MdOutlineLogout color="#FFFFFF" size={"18px"} />
                        <Typography
                            fontWeight={400}
                            fontSize={"18px"}
                            textTransform={"none"}
                            color={"#A8A8A8"}
                        >
                            Logout
                        </Typography>
                    </Box>
                </Button>
            </Box>
        </Menu>
    );
}
