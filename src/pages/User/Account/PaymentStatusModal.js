import { Box, Typography } from "@mui/material";
import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FaCircleXmark } from "react-icons/fa6";
import Modal from "../../../components/Modal";

export default function PaymentStatusModal({ showModal, setShowModal, status, message }) {
    return (
        <Modal
            heading={""}
            open={showModal}
            onClose={() => setShowModal(false)}
            sx={{
                background: "linear-gradient(79.98deg, #4A1995 -3.67%, #0F061F 101.19%)",
                border: "1px solid #E9E9E9",
                borderRadius: "10px",
                "& #modal-heading": {
                    fontWeight: 500,
                },
            }}
        >
            <Box
                width={"100%"}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "30px",
                }}
            >
                {status === "success" ? (
                    <FaCheckCircle size={"150px"} color="green" />
                ) : (
                    <FaCircleXmark height={"100px"} width={"100px"} color="red" />
                )}
                <Typography fontWeight={800} fontSize={"30px"} color={"#FFFFFF"}>
                    {message}
                </Typography>
            </Box>
        </Modal>
    );
}
