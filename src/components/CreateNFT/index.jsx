import { ethers } from "ethers";
import React, { useState } from "react";
import ABI from "../../constants/contractABI.json";
import { DesiredChainId, contractAddress } from "../../constants/helper";

export default function CreateNFT({ fileURI }) {
    const [connectedWallet, setConnectedWallet] = useState(undefined);

    let provider = null;
    let accounts;
    const contractABI = ABI.abi;
    window.onload = () => {
        if (window.ethereum) {
            window.ethereum.on("chainChanged", test);
            window.ethereum.on("accountsChanged", test2);
        }
    };

    const test = async () => {
        console.log("change");
        await correctChainId();
    };

    const test2 = a => {
        console.log("change2", a);
        accounts = a;
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
            console.log(err);
        }
    };

    const verifyuMessage = (message, address, signature) => {
        try {
            const signerAddr = ethers.verifyMessage(message, signature);
            console.log("signerAddr: " + signerAddr);
            if (signerAddr !== address) {
                return false;
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    };

    const signMessage = async signer => {
        const message = "Hi, Welcome to AI Verse";
        const sig = await signer.signMessage(message);

        const address = await signer.getAddress();

        console.log(address);

        // Validating a message; notice the address matches the signer
        const res = verifyuMessage(message, address, sig);
        console.log("res is", res);

        return sig;
    };

    const connectWallet = async () => {
        if (connectedWallet) {
            setConnectedWallet(undefined);
        } else {
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
                accounts = await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();

                console.log("the account is " + accounts[0]);

                setConnectedWallet(accounts[0]);

                await correctChainId();

                const hasWalletPermissions = await provider.send("wallet_getPermissions");
                console.log({ hasWalletPermissions });

                const isUnlocked = await window?.ethereum?._metamask.isUnlocked();
                console.log({ isUnlocked });

                const storedSignature = localStorage.getItem("signature");

                if (storedSignature) {
                    //
                } else {
                    const sig = await signMessage(signer);
                    localStorage.setItem("signature", sig);
                }

                const contract = await createContractInstance(signer);
                console.log("The contract object is", contract);
                const object = { contract: contract, walletAddress: accounts[0] };
                return object;
            } else {
                return <h1> Please install metamask</h1>;
            }
        }
    };

    const fetchData = async (contract, connectedWallet, cid) => {
        if (contract && connectedWallet) {
            const amount = ethers.parseUnits("1.0", 9);

            const amt = amount.toString();

            const res = await contract.safeMint(connectedWallet, cid, { value: amt });
            console.log("res is", res);
            if (res) {
                alert("Your NFT has been successfully minted");
            }
        } else {
            console.log("Failed to connect wallet, or load contract instance");
            await connectWallet();
        }
    };

    const createContractInstance = async signer => {
        console.log("Test run", contractAddress, contractABI);
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        return contract;
    };

    const metaData = {
        name: "User's NFT",
        description: "This is an AI Verse Collectoin NFT",
        image: `${fileURI}`,
    };

    const nftMetadata = JSON.stringify(metaData);

    const uploadMetaDataToIPFS = async metaData => {
        try {
            console.log("Uploading Metadata");
            const formData = new FormData();

            // Convert metadata string to Blob
            const blob = new Blob([metaData], { type: "application/json" });
            formData.append("file", blob, "metadata.json");

            console.log("File Appended");

            const metadata = JSON.stringify({
                name: "User's NFT Metadata",
            });
            formData.append("pinataMetadata", metadata);

            console.log("Metadata Appended");

            const options = JSON.stringify({
                cidVersion: 0,
            });
            formData.append("pinataOptions", options);

            console.log("Options done", metaData);

            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.REACT_APP_JWT}`,
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const resData = await res.json();
            let nftcid = `ipfs://${resData.IpfsHash}`;
            console.log(resData);
            console.log("The cid is ", nftcid);
            return nftcid;
        } catch (error) {
            console.log(error);
        }
    };

    const handleButtonClick = async () => {
        const cid = await uploadMetaDataToIPFS(nftMetadata);

        const object = await connectWallet();

        await fetchData(object.contract, object.walletAddress, cid);
    };

    return (
        <div style={{marginLeft: "5px"}}>
            <button onClick={handleButtonClick}> Createt NFT</button>
        </div >
    );
}
