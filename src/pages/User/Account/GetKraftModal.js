import { Box, Button, Typography } from "@mui/material";
import React from "react";
import Modal from "../../../components/Modal";
import { ArrowDividerIcon } from "../../../icons/ArrowDividerIcon";

export default function GetKraftModal({ showModal, setShowModal }) {
    return (
        <Modal
            heading={"Get more credits here"}
            open={showModal}
            onClose={() => setShowModal(false)}
            sx={{
                background: "linear-gradient(79.98deg, #4A1995 -3.67%, #0F061F 101.19%)",
                border: "1px solid #E9E9E9",
                borderRadius: "10px",
                "& #modal-heading": {
                    fontWeight: 700,
                },
            }}
        >
            <Box
                width={"100%"}
                sx={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}
            >
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"25%"}
                    py={"30px"}
                    gap={"30px"}
                    sx={{
                        background:
                            "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                        border: "1px solid #E9E9E947",
                        borderRadius: "10px",
                    }}
                >
                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                    >
                        <Typography color={"#FFFFFF"} fontWeight={800} fontSize={"40px"}>
                            3500
                        </Typography>
                        <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                            Credits
                        </Typography>
                    </Box>
                    <Button
                        sx={{
                            background: "linear-gradient(180deg, #9633D8 0%, #861FF5 100%)",
                            color: "#FFFFFF",
                            borderRadius: "12px",
                        }}
                    >
                        BUY CREDITS
                    </Button>
                    <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                        $49.00
                    </Typography>
                </Box>
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"25%"}
                    pb={"30px"}
                    pt={"10px"}
                    gap={"30px"}
                    sx={{
                        background:
                            "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                        border: "1px solid #E9E9E947",
                        borderRadius: "10px",
                    }}
                >
                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        mb={"-25px"}
                    >
                        <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                            Most Popular
                        </Typography>
                        <ArrowDividerIcon />
                    </Box>
                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                    >
                        <Typography color={"#FFFFFF"} fontWeight={800} fontSize={"40px"}>
                            8000
                        </Typography>
                        <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                            Credits
                        </Typography>
                    </Box>
                    <Button
                        sx={{
                            background: "linear-gradient(180deg, #9633D8 0%, #861FF5 100%)",
                            color: "#FFFFFF",
                            borderRadius: "12px",
                        }}
                    >
                        BUY CREDITS
                    </Button>
                    <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                        $90.00
                    </Typography>
                </Box>
                <Box
                    display={"flex"}
                    flexDirection={"column"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"25%"}
                    py={"30px"}
                    gap={"30px"}
                    sx={{
                        background:
                            "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                        border: "1px solid #E9E9E947",
                        borderRadius: "10px",
                    }}
                >
                    <Box
                        display={"flex"}
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                    >
                        <Typography color={"#FFFFFF"} fontWeight={800} fontSize={"40px"}>
                            9700
                        </Typography>
                        <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                            Credits
                        </Typography>
                    </Box>
                    <Button
                        sx={{
                            background: "linear-gradient(180deg, #9633D8 0%, #861FF5 100%)",
                            color: "#FFFFFF",
                            borderRadius: "12px",
                        }}
                    >
                        BUY CREDITS
                    </Button>
                    <Typography color={"#FFFFFF"} fontWeight={400} fontSize={"16px"}>
                        $120.00
                    </Typography>
                </Box>
            </Box>
        </Modal>
    );
}
