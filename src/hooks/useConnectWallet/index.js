import { Button, TextField } from "@mui/material";
import { useLoginWithEmail, usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../apis/auth";
import Modal from "../../components/Modal";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";
import Miner from "../../shared/Miner";
import { fixedBalance, getPoWContract, getRPCURL } from "../../shared/web3utils";

const message = "Welcome to Metakraft AI!";
export default function useConnectWallet({
    setContract,
    setUserWallet,
    user,
    setToken,
    setBalance,
    setChainId,
    setSigner,
}) {
    const [connectedWallet, setConnectedWallet] = useState(null);
    const [showPrivyOtpModal, setShowPrivyOtpModal] = useState(false);
    const [privyOtpVerifying, setPrivyOtpVerifying] = useState(false);
    const [privyOtp, setPrivyOtp] = useState("");
    const { authenticated, user: privyUser, createWallet } = usePrivy();
    const { sendCode, loginWithCode } = useLoginWithEmail();
    const { wallets, ready } = useWallets();

    const getPrivyUser = useCallback(async () => {
        if (authenticated && privyOtpVerifying && ready) {
            if (!wallets?.length) {
                try {
                    await createWallet();
                } catch (e) {
                    console.log("Error while creating wallet", e.message);
                }
                return;
            }

            connectWallet({ emailAddress: privyUser?.email?.address, walletProvider: "privy" });
            setPrivyOtpVerifying(false);
            setShowPrivyOtpModal(false);
        }
    }, [authenticated, ready]);

    useEffect(() => {
        getPrivyUser();
    }, [getPrivyUser]);

    const verifyMessageSignature = (message, address, signature) => {
        try {
            const signerAddr = ethers.verifyMessage(message, signature);
            return signerAddr === address;
        } catch (err) {
            console.log("Signature error", err);
            return false;
        }
    };

    const signMessage = async (signer, address) => {
        const { signature } = await signer.signMessage(message, "Login");
        const res = verifyMessageSignature(message, address, signature);
        return res ? signature : null;
    };

    const connectWallet = async ({ emailAddress, auth = true, walletProvider = "metakeep" }) => {
        if (connectedWallet) {
            setConnectedWallet(null);
        } else {
            try {
                let provider, account, userWallet;
                if (walletProvider === "metakeep") {
                    const data = await connectMetakeep(emailAddress);
                    provider = data.provider;
                    account = data.account;
                    userWallet = data.userWallet;
                } else if (walletProvider === "privy") {
                    const data = await connectPrivy(emailAddress);
                    if (data === 0) {
                        return 0;
                    } else {
                        provider = data.provider;
                        account = data.account;
                        userWallet = data.userWallet;
                    }
                }
                const signer = await provider.getSigner();
                const { chainId } = await provider.getNetwork();
                const chain = Number(chainId.toString());
                setConnectedWallet(account);
                const balance = await provider.getBalance(account);
                setBalance(balance?.hex || balance);
                setChainId(chain);
                setSigner(signer);

                let storedSignature = localStorage.getItem(account);
                if (storedSignature) {
                    const res = verifyMessageSignature(message, account, storedSignature);

                    if (!res) {
                        toast.error("Signature expired, please authenticate again");
                        storedSignature = null;
                        localStorage.removeItem(account);
                    }
                }
                if (!storedSignature) {
                    storedSignature = await signMessage(signer, account);
                    localStorage.setItem(account, storedSignature);
                }

                const fixedBalancec = fixedBalance(balance?.hex || balance);

                if (fixedBalancec <= 0.001) {
                    toast.info("Please sign the transaction for gas refill");
                    await distributeGas({
                        provider,
                        address: account,
                        chain,
                        signer,
                    });
                }

                createContractInstance({ signer, account });

                if (!user && userWallet?.email && auth) {
                    const ref_by = localStorage?.getItem("ref_by");
                    const res = await login({
                        email: userWallet?.email,
                        signature: storedSignature,
                        address: account,
                        chainId: DesiredChainId,
                        provider: walletProvider,
                        ref_by,
                    });
                    if (res) {
                        setToken(res);
                        localStorage.setItem("token", res);
                    }
                }
            } catch (err) {
                console.error("The error in contract is:", err);
                toast.error("Error connecting wallet");
                return null;
            }
        }
    };

    const createContractInstance = ({ signer, account }) => {
        const contract = new ethers.Contract(contractAddress, ABI.abi, signer);
        setContract(contract);
        setUserWallet(account);

        return contract;
    };

    const distributeGas = async ({ provider, address, chain, signer }) => {
        try {
            const nonce = await signer.getNonce();

            const functionSignature = "0x0c11dedd";
            const miner = new Miner();

            const { gasPrice } = await miner.mineGasForTransaction(nonce, 100_000, address);

            const request = {
                to: getPoWContract(chain),
                data: `${functionSignature}000000000000000000000000${address.substring(2)}`,
                gasLimit: 100_000,
                gasPrice,
            };
            const response = await signer.sendTransaction(request);

            await provider.waitForTransaction(response.hash, 1);
        } catch (err) {
            console.error(err);
            toast.warn("Error in distributing gas.");
        }
    };

    const connectMetakeep = async email => {
        const sdk = new MetaKeep({
            appId: process.env.REACT_APP_METAKEEP_APPID,
            chainId: DesiredChainId,
            rpcNodeUrls: {
                1020352220: getRPCURL(1020352220),
                1350216234: getRPCURL(1350216234),
            },
            user: { email: email || "" },
        });

        const web3Provider = await sdk.ethereum;
        await web3Provider.enable();
        const provider = new ethers.BrowserProvider(web3Provider);
        const accounts = await sdk.getWallet();
        const userWallet = accounts.user;
        const account = accounts?.wallet?.ethAddress;

        return { provider, userWallet, account };
    };

    const connectPrivy = async email => {
        if (authenticated) {
            const provider = await wallets?.[0]?.getEthersProvider();
            const emailAddress = privyUser?.email?.address;
            const walletAddress = privyUser?.wallet?.address;

            return { provider, userWallet: { email: emailAddress }, account: walletAddress };
        } else {
            await sendCode({ email });
            toast.success("Otp sent successfully");
            setShowPrivyOtpModal(true);
            return 0;
        }
    };

    const RenderPrivyOtpModal = () => {
        return (
            <Modal
                heading={"Enter OTP"}
                subHeading={"Enter your otp to login with privy"}
                open={showPrivyOtpModal}
                onClose={() => {}}
            >
                <form
                    onSubmit={async e => {
                        setPrivyOtpVerifying(true);
                        e.preventDefault();
                        await loginWithCode({ code: privyOtp });
                    }}
                >
                    <TextField
                        sx={{
                            background: "#141414",
                            borderRadius: 3,
                            borderColor: "#303134",
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                    borderColor: "#303134", // Default border color
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: "#303134", // Focused border color
                                },
                            },
                        }}
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        value={privyOtp}
                        onChange={e => setPrivyOtp(e.target.value)}
                        id="otp"
                        label="OTP"
                        name="otp"
                        autoComplete="otp"
                        autoFocus
                        InputLabelProps={{
                            style: {
                                color: "#49494B",
                                border: 5,
                                borderRadius: 12,
                                borderColor: "#303134",
                            },
                        }}
                        InputProps={{
                            style: {
                                color: "#3B3C3F",
                                border: 5,
                                borderRadius: 12,
                                borderColor: "#303134",
                            },
                        }}
                    />

                    <Button
                        variant="outlined"
                        type="primary"
                        disabled={privyOtpVerifying}
                        sx={{
                            border: "1px solid #E18BFF",
                            "&:hover": {
                                border: "1px solid #4E3562",
                            },
                            "&.Mui-disabled": {
                                color: "#FFFFFF",
                                border: "1px solid #4E3562",
                            },
                            color: "#FFFFFF",
                        }}
                        fullWidth
                    >
                        {privyOtpVerifying ? "Verifying..." : "Verify"}
                    </Button>
                </form>
            </Modal>
        );
    };

    return { connectWallet, RenderPrivyOtpModal };
}
