import SkyEtherContractService from "@decloudlabs/skynet/lib/services/SkyEtherContractService";
import { Button, TextField } from "@mui/material";
import { useLoginWithEmail, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEmailOtpAuth, useTriaAuth } from "@tria-sdk/authenticate-react";
import { TriaProvider } from "@tria-sdk/connect";
import { ethers } from "ethers";
import { ethers as ethers5 } from "ethers-5";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../apis/auth";
import Modal from "../../components/Modal";
import { DesiredChainId } from "../../constants/helper";
import Miner from "../../shared/Miner";
import {
    fixedBalance,
    getMintAbi,
    getMintContract,
    getPoWContract,
    getSupportedChains,
} from "../../shared/web3utils";

const message = "Welcome to Metakraft AI!";
export default function useConnectWallet({
    setContract,
    setUserWallet,
    user,
    setToken,
    setBalance,
    setChainId,
    setSigner,
    setSkynetBrowserInstance,
}) {
    const [connectedWallet, setConnectedWallet] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otp, setOtp] = useState("");
    const { authenticated, user: privyUser, createWallet, ready: privyReady } = usePrivy();
    const { sendCode, loginWithCode } = useLoginWithEmail();
    const { wallets, ready } = useWallets();
    const {
        isAuthenticated: isTriaAuthenticated,
        isReady: isTriaReady,
        getAccount,
    } = useTriaAuth();
    const {
        authStep,
        initiateEmailOtp,
        waitingVerification,
        verifyOtp,
        subscribeToOtpInput,
        checkNameAvailability,
        createUserName,
        email: triaEmail,
        otpIframeUrl,
    } = useEmailOtpAuth();
    const [method, setMethod] = useState("");
    const [username, setUsername] = useState("");
    const [isNameAvailable, setIsNameAvailable] = useState(true);

    useEffect(() => {
        if (authStep === "otp") {
            subscribeToOtpInput();
        }
    }, [authStep, subscribeToOtpInput]);

    const getPrivyUser = useCallback(async () => {
        if (authenticated && otpVerifying && ready && privyReady && wallets?.length) {
            connectWallet({ emailAddress: privyUser?.email?.address, walletProvider: "privy" });
            setOtpVerifying(false);
            setShowOtpModal(false);
        }
        if (authenticated && otpVerifying && ready && privyReady && !wallets?.length) {
            try {
                await createWallet();
            } catch (e) {
                console.log("Error while creating wallet", e.message);
            }
        }
    }, [authenticated, ready, privyReady]);

    const getTriaUser = useCallback(async () => {
        if (isTriaAuthenticated) {
            connectWallet({ emailAddress: triaEmail, walletProvider: "tria" });
            setShowOtpModal(false);
        }
    }, [isTriaAuthenticated, authStep]);

    useEffect(() => {
        getPrivyUser();
    }, [getPrivyUser]);

    useEffect(() => {
        getTriaUser();
    }, [getTriaUser]);

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
        const signature = await signer.signMessage(message);
        const res = verifyMessageSignature(message, address, signature);
        return res ? signature : null;
    };

    const connectWallet = async ({ emailAddress, auth = true, walletProvider = "tria" }) => {
        setMethod(walletProvider);
        if (connectedWallet) {
            setConnectedWallet(null);
        } else {
            try {
                let provider, provider5, account, userWallet;
                if (walletProvider === "tria") {
                    const data = await connectTria(emailAddress);
                    if (data === 0) {
                        return 0;
                    } else {
                        provider = data.provider;
                        provider5 = data.provider5;
                        account = data.account;
                        userWallet = data.userWallet;
                    }
                } else if (walletProvider === "privy") {
                    const data = await connectPrivy(emailAddress);
                    if (data === 0) {
                        return 0;
                    } else {
                        provider = data.provider;
                        provider5 = data.provider5;
                        account = data.account;
                        userWallet = data.userWallet;
                    }
                }
                const signer = await provider.getSigner();
                const { chainId } = await provider.getNetwork();
                const chain = Number(chainId.toString());
                setConnectedWallet(account);
                const balance = await provider.getBalance(account);
                setBalance(BigInt(balance?._hex || balance?.hex || balance).toString());
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

                const fixedBalancec = fixedBalance(
                    BigInt(balance?._hex || balance?.hex || balance),
                );
                if (fixedBalancec <= 0.001 && chain === DesiredChainId) {
                    await distributeGas({
                        provider,
                        address: account,
                        chain,
                        signer,
                    });
                }

                await createContractInstance({ signer, account, chain });
                await createSkynetInstance({ provider: provider5, address: account });

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

    const createContractInstance = async ({ signer, account, chain }) => {
        const abi = await getMintAbi(chain);
        const contract = new ethers.Contract(getMintContract(chain), abi, signer);
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
            toast.info("Please sign the transaction for gas refill");

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

    const connectPrivy = async email => {
        if (authenticated && ready && privyReady && wallets?.length) {
            const web3Provider = await wallets?.[0]?.getEthereumProvider();
            const provider = new ethers.BrowserProvider(web3Provider);
            const provider5 = new ethers5.providers.Web3Provider(web3Provider);
            const emailAddress = privyUser?.email?.address;
            const walletAddress = privyUser?.wallet?.address;

            return {
                provider,
                userWallet: { email: emailAddress },
                account: walletAddress,
                provider5,
            };
        } else if (ready) {
            await sendCode({ email });
            toast.success("Otp sent successfully");
            setShowOtpModal(true);
            return 0;
        } else {
            setOtpVerifying(true);
            return 0;
        }
    };

    const connectTria = async email => {
        if (isTriaAuthenticated && isTriaReady) {
            const web3Provider = new TriaProvider({
                environment: "testnet",
                config: {
                    chains: getSupportedChains(),
                },
            });
            const provider = new ethers.BrowserProvider(web3Provider);
            const provider5 = new ethers5.providers.Web3Provider(web3Provider);
            const emailAddress = triaEmail;
            const walletAddress = getAccount()?.evm?.address;

            return {
                provider,
                userWallet: { email: emailAddress },
                account: walletAddress,
                provider5,
            };
        } else if (isTriaReady) {
            await initiateEmailOtp(email);
            toast.success("Otp sent successfully");
            setShowOtpModal(true);
            return 0;
        } else {
            setOtpVerifying(true);
            return 0;
        }
    };

    const RenderOtpModal = () => {
        return (
            <Modal
                heading={"Enter OTP"}
                subHeading={"Enter your otp to login"}
                open={showOtpModal}
                onClose={() => {}}
            >
                <form
                    onSubmit={async e => {
                        e.preventDefault();
                        if (method === "privy") {
                            setOtpVerifying(true);
                            await loginWithCode({ code: otp });
                        } else if (method === "tria") {
                            if (authStep === "otp") {
                                await verifyOtp();
                            }
                            if (authStep === "createName") {
                                const available = await checkNameAvailability(username);
                                setIsNameAvailable(available);

                                if (!available) {
                                    return;
                                }
                                await createUserName(username);
                            }
                        }
                    }}
                >
                    {method === "privy" ? (
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
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
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
                    ) : method === "tria" && authStep === "otp" ? (
                        <iframe src={otpIframeUrl} title="OTP Input" height={"80px"} />
                    ) : method === "tria" && authStep === "createName" ? (
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
                            helperText={!isNameAvailable && "Username is not available"}
                            min={3}
                            fullWidth
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            id="username"
                            label="Choose a username"
                            name="username"
                            autoComplete="username"
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
                    ) : (
                        ""
                    )}

                    <Button
                        variant="outlined"
                        type="primary"
                        disabled={otpVerifying || waitingVerification}
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
                        {otpVerifying || waitingVerification ? "Verifying..." : "Verify"}
                    </Button>
                </form>
            </Modal>
        );
    };

    const createSkynetInstance = async ({ provider, address }) => {
        const signer = provider.getSigner();
        const contractInstance = new SkyEtherContractService(provider, signer, address, 11); // 11 is the chain Id of Skynet

        // Dynamically import SkyMainBrowser and SkyBrowserSigner
        const { default: SkyMainBrowser } = await import(
            "@decloudlabs/skynet/lib/services/SkyMainBrowser"
        );
        const { default: SkyBrowserSigner } = await import(
            "@decloudlabs/skynet/lib/services/SkyBrowserSigner"
        );

        const skyMainBrowser = new SkyMainBrowser(
            contractInstance,
            address, // connected wallet address
            new SkyBrowserSigner(address, signer),
        );

        await skyMainBrowser.init();

        setSkynetBrowserInstance(skyMainBrowser);
    };

    return { connectWallet, RenderOtpModal };
}
