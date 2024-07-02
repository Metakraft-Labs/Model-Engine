import { Button, Typography } from "@mui/material";
import { ethers } from "ethers";
import React, { useContext, useState } from "react";
import { mint } from "../../apis/nft";
import Modal from "../../components/Modal";
import { DesiredChainId } from "../../constants/helper";
import UserStore from "../../contexts/UserStore";
import { CoinIcon } from "../../icons/CoinIcon";
import { getBlockExplorer } from "../../shared/web3utils";

export default function CreateNFT({ fileURI, url, prompt, type }) {
    const [cid, setCID] = useState(null);
    const [mintLoading, setMintLoading] = useState(false);
    const [contractRes, setContractRes] = useState(null);
    const { contract, userWallet } = useContext(UserStore);

    window.onload = () => {
        if (window.ethereum) {
            window.ethereum.on("chainChanged", checkConnectedChain);
        }
    };

    const checkConnectedChain = async () => {
        await correctChainId();
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

    const fetchData = async cid => {
        try {
            if (contract && userWallet) {
                const amount = ethers.parseUnits("1.0", 9);

                const amt = amount.toString();

                const res = await contract.safeMint(userWallet, cid, { value: amt });

                if (res) {
                    await mint({
                        prompt,
                        url,
                        transactionHash: res.hash,
                        chainId: Number(res.chainId),
                        type,
                    });
                    setContractRes(res);
                }
            } else {
                console.log("Failed to connect wallet, or load contract instance");
                return null;
            }
        } catch (err) {
            console.log("The Error is:", err);
            alert("Transaction Unsuccessful");
            if (err.message === "User Rejected Transactoin") {
                console.log("The Error is user rejected transaction");
            }
        }
    };

    const metaData = {
        name: "User's NFT",
        description: "This is an AI Verse Collectoin NFT",
        image: `${fileURI}`,
    };

    const nftMetadata = JSON.stringify(metaData);

    const uploadMetaDataToIPFS = async metaData => {
        if (!cid) {
            try {
                const formData = new FormData();

                // Convert metadata string to Blob
                const blob = new Blob([metaData], { type: "application/json" });
                formData.append("file", blob, "metadata.json");

                const metadata = JSON.stringify({
                    name: "User's NFT Metadata",
                });
                formData.append("pinataMetadata", metadata);

                const options = JSON.stringify({
                    cidVersion: 0,
                });
                formData.append("pinataOptions", options);

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

                return nftcid;
            } catch (error) {
                console.log(error);
            }
        } else {
            return cid;
        }
    };

    const handleButtonClick = async () => {
        setMintLoading(true);
        const cid = await uploadMetaDataToIPFS(nftMetadata);
        setCID(cid);

        await fetchData(cid);

        setMintLoading(false);
    };

    return (
        <>
            <Button
                variant="outlined"
                type="primary"
                onClick={handleButtonClick}
                disabled={mintLoading}
                sx={{
                    border: "1px solid #E18BFF",
                    "&:hover": {
                        border: "1px solid #4E3562",
                    },
                }}
                fullWidth
                startIcon={<CoinIcon />}
            >
                {mintLoading ? "Minting..." : "Mint NFT"}
            </Button>

            {contractRes && (
                <Modal
                    open={!!contractRes}
                    onClose={() => setContractRes(null)}
                    heading={"Your NFT is successfully minted."}
                >
                    <Typography variant="body1">
                        Here is your transaction hash:{" "}
                        <a
                            href={`${getBlockExplorer(Number(contractRes?.chainId))}/tx/${contractRes?.hash}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {contractRes?.hash}
                        </a>
                    </Typography>
                </Modal>
            )}
        </>
    );
}
