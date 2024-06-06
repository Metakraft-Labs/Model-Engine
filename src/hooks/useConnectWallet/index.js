import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../apis/auth";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";
import UserStore from "../../contexts/UserStore";

export default function useConnectWallet() {
    const { setContract, setUserWallet, user, setToken } = useContext(UserStore);
    const [connectedWallet, setConnectedWallet] = useState(null);
    let provider = null;
    let account = null;

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("chainChanged", correctWindowChain);
            window.ethereum.on("accountsChanged", correctWindowAccount);
        }
    }, []);

    const correctWindowChain = async () => {
        await correctChainId();
    };

    const correctWindowAccount = a => {
        account = a[0];
        setConnectedWallet(a[0]);
    };

    const correctChainId = async () => {
        try {
            const { chainId } = await provider.getNetwork();
            if (chainId !== DesiredChainId) {
                await provider.send("wallet_switchEthereumChain", [
                    { chainId: `0x${DesiredChainId.toString(16)}` },
                ]);

                provider = new ethers.BrowserProvider(window.ethereum);
            }
        } catch (err) {
            console.log("Chain ID error", err);
        }
    };

    const verifyMessageSignature = (message, address, signature) => {
        try {
            const signerAddr = ethers.verifyMessage(message, signature);
            return signerAddr === address;
        } catch (err) {
            console.log("Signature error", err);
            return false;
        }
    };

    const signMessage = async sdk => {
        const message = "Welcome to Metakraft AI!";
        const { signature } = await sdk.signMessage(message, "Login");
        const address = await sdk.getWallet();
        const res = verifyMessageSignature(message, address, signature);
        return res ? signature : null;
    };

    const connectWallet = async () => {
        if (connectedWallet) {
            setConnectedWallet(null);
        } else {
            if (window.ethereum) {
                try {
                    const sdk = new MetaKeep({
                        appId: process.env.REACT_APP_METAKEEP_APPID,
                        chainId: DesiredChainId,
                        rpcNodeUrls: {
                            1020352220: process.env.REACT_APP_TITAN_RPC,
                        },
                        user: { email: user?.email || "" },
                    });

                    const web3Provider = await sdk.ethereum;
                    await web3Provider.enable();
                    provider = new ethers.BrowserProvider(web3Provider);

                    const accounts = await sdk.getWallet();
                    const userWallet = await sdk.getUser();
                    const signer = await provider.getSigner();
                    account = accounts?.wallet?.ethAddress;
                    setConnectedWallet(account);
                    await correctChainId();

                    const storedSignature = localStorage.getItem(account);
                    if (!storedSignature) {
                        const sig = await signMessage(sdk);
                        localStorage.setItem(account, sig);
                    }

                    createContractInstance(signer);

                    if (!user && userWallet?.email) {
                        const res = await login({ email: userWallet?.email, address: account });
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
            } else {
                console.log("Metamask not found");
            }
        }
    };

    const createContractInstance = signer => {
        const contract = new ethers.Contract(contractAddress, ABI.abi, signer);
        setContract(contract);
        setUserWallet(account);

        return contract;
    };

    return { connectWallet };
}
