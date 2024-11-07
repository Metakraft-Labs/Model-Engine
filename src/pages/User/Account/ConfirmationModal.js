import { Box, Button, Typography } from "@mui/material";
import { Contract } from "ethers";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { orderTokens } from "../../../apis/contractPayments";
import Modal from "../../../components/Modal";
import { UserStore } from "../../../contexts/UserStore";
import { tokenPlans } from "../../../shared/constants";
import {
    fixedBalance,
    getRPCURL,
    getSupportedChains,
    getTransactionAbi,
    getTransactionContract,
    getUSDCAbi,
    getUSDCContract,
} from "../../../shared/web3utils";

export default function ConfirmationModal({ plan, showModal, setShowModal }) {
    const { chainId, signer, userWallet } = useContext(UserStore);
    const [loading, setLoading] = useState(false);
    const [approved, setApproved] = useState(false);
    const [balance, setBalance] = useState(0);
    const [checkBalance, setCheckBalance] = useState(true);
    const [message, setMessage] = useState("Please confirm the transaction");

    const USDC_CONTRACT_ADDRESS = getUSDCContract(chainId);

    const getBalance = useCallback(async () => {
        if (checkBalance) {
            const abi = await getUSDCAbi(chainId);
            const contract = new Contract(USDC_CONTRACT_ADDRESS, abi, signer);

            const balance = await contract.balanceOf(userWallet);

            setBalance(balance);

            setCheckBalance(false);
        }
    }, [checkBalance]);

    useEffect(() => {
        getBalance();
    }, [getBalance]);

    const orderToken = async () => {
        if (!plan) {
            toast.error("Please select a plan");
            return;
        }
        setLoading(true);
        try {
            const amount = tokenPlans[plan].usd;
            const abi = await getTransactionAbi(chainId);
            const usdcAbi = await getUSDCAbi(chainId);
            const contract = new Contract(getTransactionContract(chainId), abi, signer);
            const contractUSDC = new Contract(USDC_CONTRACT_ADDRESS, usdcAbi, signer);

            toast.info("Please approve the payment");

            await contractUSDC.approve(getTransactionContract(chainId), amount * 1000000);

            setApproved(true);

            const tx = await contract.safeTransferFrom(
                "0xcb1e08E5867C262F00813f6fCc5398727952f098",
                amount * 1000000,
            );

            setMessage("Please wait while we are verifying the payment");

            const transactionHash = tx.hash;
            const rpcUrl = getRPCURL(chainId);

            const res = await orderTokens({ plan, rpcUrl, transactionHash });

            if (res) {
                setShowModal(false);
                window.location.href = `${window.origin}/user/account?payment_status=success&payment_message=Your payment is successful`;
            }
        } catch (err) {
            console.error("Tx failed", err);
            toast.error("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            heading={"Confirm"}
            open={showModal}
            onClose={loading ? () => {} : () => setShowModal(false)}
            sx={{
                background: "linear-gradient(79.98deg, #4A1995 -3.67%, #0F061F 101.19%)",
                border: "1px solid #E9E9E9",
                borderRadius: "10px",
                "& #modal-heading": {
                    fontWeight: 500,
                },
                maxHeight: "500px",
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
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {approved ? (
                    <Typography
                        textAlign={"center"}
                        color={"#FFFFFF"}
                        fontWeight={500}
                        fontSize={"16px"}
                    >
                        {message}
                    </Typography>
                ) : (
                    <>
                        {balance < tokenPlans[plan]?.usd * 1000000 && (
                            <Typography
                                textAlign={"center"}
                                color={"#FFFFFF"}
                                fontWeight={500}
                                fontSize={"16px"}
                            >
                                Your balance is low. Kindly topup your wallet with{" "}
                                {tokenPlans[plan].usd} USDC.
                            </Typography>
                        )}
                        <Typography
                            textAlign={"center"}
                            color={"#FFFFFF"}
                            fontWeight={500}
                            fontSize={"16px"}
                        >
                            Tital USDC balance: {fixedBalance(balance || 0, 6)} USDC
                        </Typography>

                        {balance < tokenPlans[plan]?.usd * 1000000 ? (
                            <>
                                <Typography
                                    textAlign={"center"}
                                    color={"#FFFFFF"}
                                    fontWeight={500}
                                    fontSize={"16px"}
                                >
                                    Metakraft Wallet: {userWallet}
                                </Typography>
                                <Typography
                                    textAlign={"center"}
                                    color={"#FFFFFF"}
                                    fontWeight={500}
                                    fontSize={"16px"}
                                >
                                    USDC Address: {USDC_CONTRACT_ADDRESS}
                                </Typography>

                                {chainId ===
                                    getSupportedChains().find(c => c.network === "Skale")?.id && (
                                    <ol style={{ color: "#FFFFFF" }}>
                                        <li>
                                            <Typography
                                                color={"#FFFFFF"}
                                                fontWeight={500}
                                                fontSize={"16px"}
                                            >
                                                Visit the SKALE Portal bridge to get USDC on the{" "}
                                                <a href="https://testnet.portal.skale.space/bridge?from=juicy-low-small-testnet&to=aware-fake-trim-testnet&token=usdc&type=erc20">
                                                    Titan Hub
                                                </a>
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography
                                                color={"#FFFFFF"}
                                                fontWeight={500}
                                                fontSize={"16px"}
                                            >
                                                Connect your wallet with Mainnet USDC. Then bridge
                                                the USDC
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography
                                                color={"#FFFFFF"}
                                                fontWeight={500}
                                                fontSize={"16px"}
                                            >
                                                Open the wallet where you&apos;ve the Titan Hubs
                                                USDC.
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography
                                                color={"#FFFFFF"}
                                                fontWeight={500}
                                                fontSize={"16px"}
                                            >
                                                Transfer your Titan Hubs USDC to your metakraft
                                                wallet.
                                            </Typography>
                                        </li>
                                    </ol>
                                )}
                            </>
                        ) : (
                            ""
                        )}

                        <Box
                            display={"flex"}
                            justifyContent={"space-around"}
                            alignItems={"center"}
                            width={"100%"}
                        >
                            <Button
                                variant="contained"
                                color={"secondary"}
                                disabled={balance < tokenPlans[plan]?.usd * 1000000 || loading}
                                onClick={orderToken}
                            >
                                Pay now
                            </Button>
                            <Button
                                variant="contained"
                                color={"secondary"}
                                onClick={() => setCheckBalance(true)}
                            >
                                Recheck balance
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    );
}
