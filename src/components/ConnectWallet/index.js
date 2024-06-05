import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import { useContext, useEffect, useState } from "react";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";
import UserStore from "../../contexts/UserStore";

export default function useConnectWallet() {
    const { setContract, setUserWallet } = useContext(UserStore);
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

    const signMessage = async signer => {
        const message = "Hi, Welcome to AI Verse";
        const sig = await signer.signMessage(message);
        const address = await signer.getAddress();
        const res = verifyMessageSignature(message, address, sig);
        return res ? sig : null;
    };

    const connectWallet = async walletName => {
        if (connectedWallet) {
            setConnectedWallet(null);
        } else {
            if (window.ethereum) {
                try {
                    if (walletName === "metamask") {
                        provider = new ethers.BrowserProvider(window.ethereum);
                    } else {
                        const sdk = new MetaKeep({
                            appId: process.env.REACT_APP_METAKEEP_APPID,
                            chainId: DesiredChainId,
                            rpcNodeUrls: {
                                1020352220: process.env.REACT_APP_TITAN_RPC,
                            },
                        });

                        const web3Provider = await sdk.ethereum;
                        await web3Provider.enable();
                        provider = new ethers.BrowserProvider(web3Provider);
                    }

                    const accounts = await provider.send("eth_requestAccounts", []);
                    const signer = await provider.getSigner();
                    account = accounts[0];
                    setConnectedWallet(accounts[0]);
                    await correctChainId();

                    const isUnlocked = await window?.ethereum?._metamask.isUnlocked();
                    console.log({ isUnlocked });

                    const storedSignature = localStorage.getItem(accounts[0]);
                    if (!storedSignature) {
                        const sig = await signMessage(signer);
                        localStorage.setItem(accounts[0], sig);
                    }

                    const contract = createContractInstance(signer);
                    return contract;
                } catch (err) {
                    console.log("The error in contract is:", err);
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
