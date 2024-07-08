import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import { useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../apis/auth";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";
import { getRPCURL } from "../../shared/web3utils";

export default function useConnectWallet({
    setContract,
    setUserWallet,
    user,
    setToken,
    setBalance,
    setChainId,
}) {
    const [connectedWallet, setConnectedWallet] = useState(null);
    let provider = null;
    let account = null;

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

    const connectWallet = async ({ emailAddress, auth = true }) => {
        if (connectedWallet) {
            setConnectedWallet(null);
        } else {
            try {
                const sdk = new MetaKeep({
                    appId: process.env.REACT_APP_METAKEEP_APPID,
                    chainId: DesiredChainId,
                    rpcNodeUrls: {
                        1020352220: getRPCURL(1020352220),
                        1350216234: getRPCURL(1350216234),
                    },
                    user: { email: emailAddress || "" },
                });

                const web3Provider = await sdk.ethereum;
                await web3Provider.enable();
                provider = new ethers.BrowserProvider(web3Provider);

                const accounts = await sdk.getWallet();
                const userWallet = accounts.user;
                const signer = await provider.getSigner();
                account = accounts?.wallet?.ethAddress;
                setConnectedWallet(account);
                const balance = await provider.getBalance(accounts?.wallet?.ethAddress);
                setBalance(balance);
                setChainId(DesiredChainId);

                const storedSignature = localStorage.getItem(account);
                if (!storedSignature) {
                    const sig = await signMessage(sdk);
                    localStorage.setItem(account, sig);
                }

                createContractInstance(signer);

                if (!user && userWallet?.email && auth) {
                    const res = await login({
                        email: userWallet?.email,
                        address: account,
                        chainId: DesiredChainId,
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

    const createContractInstance = signer => {
        const contract = new ethers.Contract(contractAddress, ABI.abi, signer);
        setContract(contract);
        setUserWallet(account);

        return contract;
    };

    return { connectWallet };
}
