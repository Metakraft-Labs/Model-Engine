import { Box, Typography } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    getAcceptedCoins,
    orderTokens as orderCoinpaymentsTokens,
} from "../../../apis/coinpayments";
import Modal from "../../../components/Modal";

export default function SelectCoinsModal({ plan, showModal, setShowModal }) {
    const [loading, setLoading] = useState(false);
    const [coins, setCoins] = useState(null);

    const getCoins = useCallback(async () => {
        const coins = await getAcceptedCoins();

        setCoins(coins || []);
    }, []);

    useEffect(() => {
        getCoins();
    }, [getCoins]);

    const coinpaymentsOrderToken = async coin => {
        if (!plan) {
            toast.error("Please select a plan");
            return;
        }
        setLoading(true);
        const link = await orderCoinpaymentsTokens(plan, coin);

        if (link) {
            window.location.href = link;
        }
        setLoading(false);
    };

    return (
        <Modal
            heading={"Please choose a coin"}
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
                    maxHeight: "500px",
                    gap: "20px",
                    pt: "30px",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {coins ? (
                    coins?.length ? (
                        coins
                            ?.filter(f => f.includes("BEP20") || f.includes("ERC20"))
                            .map((coin, index) => {
                                return (
                                    <Box
                                        key={`coin-list-${index}`}
                                        width={"90%"}
                                        py={"30px"}
                                        sx={{
                                            background:
                                                "linear-gradient(79.98deg, rgba(74, 25, 149, 0.51) -3.67%, rgba(15, 6, 31, 0.2) 101.19%)",
                                            border: "1px solid #E9E9E947",
                                            borderRadius: "10px",
                                            cursor: loading ? "default" : "pointer",
                                        }}
                                        onClick={
                                            loading ? () => {} : () => coinpaymentsOrderToken(coin)
                                        }
                                    >
                                        <Typography
                                            textAlign={"center"}
                                            color={"#FFFFFF"}
                                            fontWeight={800}
                                            fontSize={"20px"}
                                        >
                                            {coin}
                                        </Typography>
                                    </Box>
                                );
                            })
                    ) : (
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={800}
                            fontSize={"20px"}
                        >
                            No accepted coins found
                        </Typography>
                    )
                ) : (
                    <Typography
                        textAlign={"center"}
                        color={"#FFFFFF"}
                        fontWeight={800}
                        fontSize={"20px"}
                    >
                        Fetching coins
                    </Typography>
                )}
            </Box>
        </Modal>
    );
}
