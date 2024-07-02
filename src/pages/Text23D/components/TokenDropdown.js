import { Box, Menu, MenuItem, Typography } from "@mui/material";
import React from "react";
import { CoinIcon } from "../../../icons/CoinIcon";

export default function TokenDropdown({ open, handleClose, user }) {
    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    background: "#000000",
                    color: "#A5A5A5",
                    width: "278px",
                    borderRadius: "6px",
                    border: "1px solid #454646",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            <MenuItem>
                <Box
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    flexDirection={"column"}
                    gap={"15px"}
                    border={"1px solid #A557CA"}
                    width={"100%"}
                    borderRadius={"6px"}
                    padding={"20px"}
                    sx={{
                        background: "#150B18",
                    }}
                >
                    <Typography color={"#707578"}>Current Plan</Typography>
                    <Box
                        display={"flex"}
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        width={"80%"}
                    >
                        <Typography fontSize={"18px"} color={"#61BA88"}>
                            Free
                        </Typography>

                        <Box display={"flex"} alignItems={"center"} gap={"5px"}>
                            <CoinIcon width="18" height="19" />
                            <Typography color={"#CDCECF"} fontSize={"18px"} fontWeight={400}>
                                {user?.tokens}
                            </Typography>
                            <Typography color={"#73777B"} fontSize={"12px"} fontWeight={400}>
                                left
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </MenuItem>
        </Menu>
    );
}
