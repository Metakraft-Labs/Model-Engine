import { Button, Tooltip, Typography } from "@mui/material";
import { ethers } from "ethers";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { mint } from "../../apis/nft";
import Modal from "../../components/Modal";
import UserStore from "../../contexts/UserStore";
import { CoinIcon } from "../../icons/CoinIcon";
import { getBlockExplorer } from "../../shared/web3utils";

export default function CreateNFT({
    fileURI,
    url,
    prompt,
    type,
    name,
    description,
    tags,
    download,
    license,
    mintCost,
}) {
    const [cid, setCID] = useState(null);
    const [mintLoading, setMintLoading] = useState(false);
    const [contractRes, setContractRes] = useState(null);
    const { contract, userWallet, signer, user, updateUser } = useContext(UserStore);

    const fetchData = async cid => {
        try {
            if (contract && userWallet) {
                const amount = ethers.utils.parseUnits("1.0", 9);

                const amt = amount.toString();
                const nonce = await signer.getNonce();
                const signature = await skyBrowser.appManager.getUrsulaAuth();
                if (!signature.success) {
                    // show error.
                    return;
                }
                const response = await fetch(
                    `${process.env.REACT_APP_SKYNET_SERVICE_URL}/createCollection`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            address: userWallet,
                            collectionName: name,
                            collectionDescription: description,
                            collectionImage: fileURI,
                            encrypt: true,
                            royalty: "10",
                            nftImage: fileURI,
                            userAuthPayload: signature.data,
                            createdAt: Date.now(),
                            ...(download === "free"
                                ? {
                                      license,
                                  }
                                : {}),
                            applicationType: "static",
                            tags,
                            mintCost: mintCost || 1,
                            staticFile: url,
                            publicMint: cost === 0,
                        }),
                    },
                );

                console.log({ response });
                return;

                const res = await contract.safeMint(userWallet, cid, { value: amt, nonce });

                if (res) {
                    await mint({
                        prompt,
                        url,
                        transactionHash: res.hash,
                        chainId: Number(res.chainId),
                        type,
                        name: name || prompt,
                        description:
                            description ||
                            `NFT for prompt: ${prompt}. Type: ${type} from Metakraft AI`,
                        tags,
                        download,
                    });
                    await updateUser();
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
        name: name || prompt,
        description: description || `NFT for prompt: ${prompt}. Type: ${type} from Metakraft AI`,
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
        if (user?.tokens < 10) {
            toast.error("You do not have enough credits for this operation");
        }
        setMintLoading(true);
        const cid = await uploadMetaDataToIPFS(nftMetadata);
        setCID(cid);

        await fetchData(cid);

        setMintLoading(false);
    };

    return (
        <>
            <Tooltip
                title={user?.tokens >= 10 ? "Click to mint" : "You need atleast 10 tokens to mint"}
                placement="right"
            >
                <Button
                    variant="outlined"
                    type="primary"
                    onClick={() => (user?.tokens >= 10 ? handleButtonClick() : null)}
                    disabled={mintLoading}
                    sx={{
                        cursor: user?.tokens >= 10 ? "pointer" : "default",
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
                    startIcon={<CoinIcon />}
                >
                    {mintLoading ? "Launching..." : "Launch"}
                </Button>
            </Tooltip>

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
