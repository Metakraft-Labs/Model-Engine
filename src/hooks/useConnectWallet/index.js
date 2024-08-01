import skynet from "@decloudlabs/skynet";
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
    setSkynetBrowserInstance,
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

    const signMessage = async (sdk, address) => {
        const { signature } = await sdk.signMessage(message, "Login");
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
                const { chainId } = await provider.getNetwork();
                const chain = Number(chainId.toString());
                account = accounts?.wallet?.ethAddress;
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
                    storedSignature = await signMessage(sdk, account);
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

                await createSkynetInstance({ provider, signer, address: account });

                createContractInstance(signer);

                if (!user && userWallet?.email && auth) {
                    const ref_by = localStorage?.getItem("ref_by");
                    const res = await login({
                        email: userWallet?.email,
                        signature: storedSignature,
                        address: account,
                        chainId: DesiredChainId,
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

    const createContractInstance = signer => {
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

    const createSkynetInstance = async ({ provider, signer, address }) => {
        const browserEnvConfig = {
            CACHE: {
                TYPE: "CACHE",
            },
        };

        const contractInstance = new skynet.SkyEtherContractService(provider, signer, address, 11); // 11 is the chain Id of Skynet

        const skyMainBrowser = new skynet.SkyMainBrowser(
            browserEnvConfig,
            contractInstance,
            address, // connected wallet address
            new SkyBrowserSigner(address, signer),
        );

        await skyMainBrowser.init();

        setSkynetBrowserInstance(skyMainBrowser);
    };

    return { connectWallet };
}
