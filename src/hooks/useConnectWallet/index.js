import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { MetaKeep } from "metakeep";
import { useState } from "react";
import { toast } from "react-toastify";
import { login } from "../../apis/auth";
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
    const { authenticated, login: loginPrivy, user: privyUser } = usePrivy();
    const { wallets } = useWallets();
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
                }
                const signer = await provider.getSigner();
                const { chainId } = await provider.getNetwork();
                const chain = Number(chainId.toString());
                setConnectedWallet(account);
                const balance = await provider.getBalance(account);
                setBalance(balance);
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

                const fixedBalancec = fixedBalance(balance);

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
            const loginUser = loginPrivy({ loginMethods: ["email"] });
        }
    };

    return { connectWallet };
}
