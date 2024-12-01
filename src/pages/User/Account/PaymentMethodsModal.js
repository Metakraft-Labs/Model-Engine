import { Box, Stack, Typography } from "@mui/material";
import { Transak } from "@transak/transak-sdk";
import React, { useContext, useEffect, useState } from "react";
import { transakConfig } from "../../../apis/transak";
import Modal from "../../../components/Modal";
import { UserStore } from "../../../contexts/UserStore";
import { tokenPlans } from "../../../shared/constants";
import ConfirmationModal from "./ConfirmationModal";
import SelectCoinsModal from "./SelectCoinsModal";

import coinbaseIcon from "../../../assets/img/coins/coinbase.png";
import transakIcon from "../../../assets/img/coins/transak.png";

export default function PaymentMethodsModal({ plan, showModal, setShowModal }) {
    // const { chainId } = useContext(UserStore);
    const [loading, _setLoading] = useState(false);
    const [showCoinsListModal, setShowCoinsListModal] = useState(false);
    const { user } = useContext(UserStore);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    // const razorpayOrderToken = async () => {
    //     if (!plan) {
    //         toast.error("Please select a plan");
    //         return;
    //     }
    //     setLoading(true);
    //     const link = await orderTokens(plan);

    //     if (link) {
    //         window.location.href = link;
    //     }
    //     setLoading(false);
    // };

    const transak = new Transak({
        ...transakConfig,
        email: user?.email ? user?.email : undefined,
        walletAddress: user?.address[0]?.address ? user?.address[0].address : undefined,
        defaultFiatAmount: tokenPlans[plan] ? tokenPlans[plan].usd : 90, // fallback amount
        userData: {
            email: user?.email ? user?.email : undefined,
        },
    });

    useEffect(() => {
        return () => {
            transak.cleanup();
        };
    }, [user]);

    const openTransak = () => {
        Transak.on("*", data => {
            if (data.eventName === "TRANSAK_WIDGET_CLOSE") {
                transak.close();
                transak.cleanup();
            }
        });
        transak.init();
    };

    return (
        <>
            <Modal
                heading={""}
                open={showModal}
                onClose={loading ? () => {} : () => setShowModal(false)}
                sx={{
                    width: "30%",
                    minWidth: "300px",
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
                    {/* <Box
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
                            Metakraft Wallet
                        </Typography>
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={500}
                            fontSize={"15px"}
                        >
                            Pay directly from ({getChainName(chainId)})
                        </Typography>
                    </Box> */}

                    <Box
                        width={"100%"}
                        sx={{
                            background:
                                "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                            border: "1px solid #E9E9E947",
                            borderRadius: "10px",
                            cursor: loading ? "default" : "pointer",
                        }}
                        onClick={openTransak}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                padding: "15px",
                            }}
                        >
                            <img src={transakIcon} alt="transak" width={48} height={48} />
                            <Stack>
                                <Typography color={"#FFFFFF"} fontWeight={800} fontSize={"20px"}>
                                    Transak
                                </Typography>
                                <Typography color={"#FFFFFF"} fontWeight={500} fontSize={"15px"}>
                                    Pay directly from transak
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                    <Box
                        width={"100%"}
                        sx={{
                            background:
                                "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                            border: "1px solid #E9E9E947",
                            borderRadius: "10px",
                            cursor: loading ? "default" : "pointer",
                        }}
                        onClick={loading ? () => {} : () => setShowCoinsListModal(true)}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                padding: "15px",
                            }}
                        >
                            <img src={coinbaseIcon} alt="coinbase" width={48} height={48} />
                            <Stack>
                                <Typography color={"#FFFFFF"} fontWeight={800} fontSize={"20px"}>
                                    Coinpayments
                                </Typography>
                                <Typography color={"#FFFFFF"} fontWeight={500} fontSize={"15px"}>
                                    Pay using multiple cryptocurrencies
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                    {/* <Box
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
                    </Box> */}
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
