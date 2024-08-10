import { Box, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { orderTokens } from "../../../apis/razorpay";
import Modal from "../../../components/Modal";
import UserStore from "../../../contexts/UserStore";
import { getChainName } from "../../../shared/web3utils";
import ConfirmationModal from "./ConfirmationModal";
import SelectCoinsModal from "./SelectCoinsModal";

export default function PaymentMethodsModal({ plan, showModal, setShowModal }) {
    const { chainId } = useContext(UserStore);
    const [loading, setLoading] = useState(false);
    const [showCoinsListModal, setShowCoinsListModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const razorpayOrderToken = async () => {
        if (!plan) {
            toast.error("Please select a plan");
            return;
        }
        setLoading(true);
        const link = await orderTokens(plan);

        if (link) {
            window.location.href = link;
        }
        setLoading(false);
    };

    return (
        <>
            <Modal
                heading={"Please choose a payment method"}
                open={showModal}
                onClose={loading ? () => {} : () => setShowModal(false)}
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
                        gap: "20px",
                    }}
                >
                    <Box
                        width={"100%"}
                        py={"30px"}
                        sx={{
                            background:
                                "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                            border: "1px solid #E9E9E947",
                            borderRadius: "10px",
                            cursor: loading ? "default" : "pointer",
                        }}
                        onClick={loading ? () => {} : () => setShowConfirmationModal(true)}
                    >
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={800}
                            fontSize={"20px"}
                        >
                            Embedded Wallet ({getChainName(chainId)})
                        </Typography>
                    </Box>
                    <Box
                        width={"100%"}
                        py={"30px"}
                        sx={{
                            background:
                                "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                            border: "1px solid #E9E9E947",
                            borderRadius: "10px",
                            cursor: loading ? "default" : "pointer",
                        }}
                        onClick={loading ? () => {} : () => setShowCoinsListModal(true)}
                    >
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={800}
                            fontSize={"20px"}
                        >
                            Coinpayments (Cryptocurrencies)
                        </Typography>
                    </Box>
                    <Box
                        width={"100%"}
                        py={"30px"}
                        sx={{
                            background: "#401681",
                            border: "1px solid #E9E9E947",
                            borderRadius: "10px",
                            cursor: loading ? "default" : "pointer",
                        }}
                        onClick={loading ? () => {} : () => razorpayOrderToken()}
                    >
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={800}
                            fontSize={"20px"}
                        >
                            Razorpay (Cards, wallets etc.)
                        </Typography>
                    </Box>
                </Box>
            </Modal>
            <SelectCoinsModal
                showModal={showCoinsListModal}
                setShowModal={setShowCoinsListModal}
                plan={plan}
            />
            <ConfirmationModal
                showModal={showConfirmationModal}
                setShowModal={setShowConfirmationModal}
                plan={plan}
            />
        </>
    );
}
