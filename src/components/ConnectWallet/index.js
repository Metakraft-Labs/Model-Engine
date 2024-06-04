import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";

export default async function ConnectWallet(walletName) {
    let provider = null;
    let accounts;
    const contractABI = ABI.abi;
    let connectedWallet = null;

    window.onload = () => {
        if (window.ethereum) {
            window.ethereum.on("chainChanged", correctWindowChain);
            window.ethereum.on("accountsChanged", correctWindowAccount);
        }
    };

    const correctWindowChain = async () => {
        await correctChainId();
    };

    const correctWindowAccount = a => {
        accounts = a;
        connectedWallet = a[0];
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

            if (signerAddr !== address) {
                return false;
            }
            return true;
        } catch (err) {
            console.log("Signature error", err);
            return false;
        }
    };

    const signMessage = async signer => {
        const message = "Hi, Welcome to AI Verse";
        const sig = await signer.signMessage(message);

        const address = await signer.getAddress();

        // Validating a message; notice the address matches the signer
        const res = verifyMessageSignature(message, address, sig);
        if (res) {
            return sig;
        } else {
            return;
        }
    };

    const connectWallet = async () => {
        console.log("the wallet is connected", walletName);
        if (connectedWallet) {
            connectedWallet = null;
        } else {
            if (window.ethereum) {
                try {
                    if (walletName === "metamask") {
                        provider = new ethers.BrowserProvider(window.ethereum);
                    } else {
                        const sdk = new MetaKeep({
                            /* App id to configure UI */
                            appId: process.env.REACT_APP_METAKEEP_APPID,
                            /* Default chain to use */
                            chainId: DesiredChainId,
                            /* RPC node urls map */
                            rpcNodeUrls: {
                                // Update with your own node URL
                                1020352220: `${process.env.REACT_APP_TITAN_RPC}`,
                            },
                        });

                        const web3Provider = await sdk.ethereum;

                        await web3Provider.enable();

                        provider = new ethers.BrowserProvider(web3Provider);
                    }
                    accounts = await provider.send("eth_requestAccounts", []);
                    const signer = await provider.getSigner();

                    connectedWallet = accounts[0];

                    await correctChainId();

                    // const hasWalletPermissions = await provider.send("wallet_getPermissions");
                    // console.log({ hasWalletPermissions });

                    const isUnlocked = await window?.ethereum?._metamask.isUnlocked();
                    console.log({ isUnlocked });

                    const storedSignature = localStorage.getItem(accounts[0]);

                    if (storedSignature) {
                        //
                    } else {
                        const sig = await signMessage(signer);
                        localStorage.setItem(accounts[0], sig);
                    }

                    const contract = await createContractInstance(signer);

                    console.log("contract is", { contract });

                    return contract;
                } catch (err) {
                    console.log("the error IN CONTRACT is:", err);
                    return null;
                }
            } else {
                console.log("Metamask not found");
            }
        }
    };

    const createContractInstance = async signer => {
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        sessionStorage.setItem("contract", contract);
        sessionStorage.setItem("signer", signer);
        sessionStorage.setItem("connectedWallet", connectedWallet);

        return contract;
    };

    const contract = await connectWallet();
    return contract;
}
