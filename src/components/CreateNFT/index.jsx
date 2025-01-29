import { Button, Tooltip, Typography } from "@mui/material";
import { Contract, ethers } from "ethers";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { mint } from "../../apis/nft";
import Modal from "../../components/Modal";
import { UserStore } from "../../contexts/UserStore";
import { CoinIcon } from "../../icons/CoinIcon";
import { getBlockExplorer, getUSDCAbi, getUSDCContract } from "../../shared/web3utils";

export default function CreateNFT({
    fileURI,
    url,
    prompt,
    type,
    name,
    description,
    tags,
    download,
    // license,
    // mintCost,
}) {
    const [cid, setCID] = useState(null);
    const [mintLoading, setMintLoading] = useState(false);
    const [contractRes, setContractRes] = useState(null);
    const { contract, userWallet, signer, user, updateUser, chainId } = useContext(UserStore);

    const fetchData = async cid => {
        try {
            if (contract && userWallet) {
                const amount = ethers.parseUnits("1.0", 6);

                const amt = amount.toString();
                // const signature = await skynetBrowserInstance.appManager.getUrsulaAuth();
                // if (!signature.success) {
                //     // show error.
                //     return;
                // }

                // const res = await axios.post(
                //     `${process.env.REACT_APP_SKYNET_SERVICE_URL}/createCollection`,
                //     {
                //         address: userWallet,
                //         collectionName: name,
                //         collectionDescription: description,
                //         collectionImage: fileURI,
                //         collectionSize: 0,
                //         softwareLock: false,
                //         noDeployment: true,
                //         privateImage: false,
                //         privateImageRegistry: "docker",
                //         privateImageUsername: "",
                //         privateImagePassword: "",
                //         imageName: "alethio/ethereum-lite-explorer",
                //         imageTag: "latest",
                //         encrypt: true,
                //         status: true,
                //         mintStatus: download !== "no",
                //         royalty: "10",
                //         nftImage: fileURI,
                //         tags: tags?.join(", "),
                //         licenseFee: "10",
                //         storageType: "file",
                //         attributeVariableParam: {
                //             name: "3D model",
                //             condition: "New",
                //         },
                //         userAuthPayload: signature.data,
                //         ...(download === "free"
                //             ? {
                //                   license,
                //               }
                //             : {}),
                //         applicationType: null,
                //         createdAt: Date.now(),
                //         mintCost,
                //         collectionCost: 1,
                //         cpuRange: "1",
                //         bandwidthRange: "1",
                //         storageRange: "1",
                //         staticFile: [url],
                //         publicMint: download === "free",
                //         marketplaceList: download !== "no",
                //         category: "3D Model",
                //         verified: true,
                //         paymentMade: true,
                //         nftImage: cid,
                //         nftId: cid?.replace("ipfs://", ""),
                //         limitedEdition: false,
                //         bundle: cid,
                //         instanceType: "cpuStandard",
                //     },
                //     {
                //         headers: {
                //             "Content-Type": "application/json",
                //         },
                //     },
                // );

                // const collectionId = res.data?.data;

                const abi = await getUSDCAbi(chainId);
                const USDC_CONTRACT_ADDRESS = getUSDCContract(chainId);
                const usdcContract = new Contract(USDC_CONTRACT_ADDRESS, abi, signer);

                const allowance = await usdcContract.allowance(userWallet, contract.target);
                const formattedAmt = ethers.formatUnits(allowance, 6);

                if (Number(formattedAmt.toString()) < 0.5) {
                    toast.error("Please approve the contract to spend USDC");
                    await usdcContract.approve(contract.target, amt);
                }
                toast.info("Sign for first mint");

                // const nonce = await signer.getNonce();
                const resp = await contract.mint(userWallet, cid);

                if (resp) {
                    await mint({
                        prompt,
                        url,
                        transactionHash: resp.hash,
                        chainId: Number(resp.chainId),
                        type,
                        name: name || prompt,
                        description:
                            description ||
                            `NFT for prompt: ${prompt}. Type: ${type} from Metakraft AI`,
                        tags,
                        download,
                        collectionId: "",
                    });
                    await updateUser();
                    setContractRes(resp);
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

        await fetchData("ipfs://QmaAAjPP96m1d7VvKUWu84PhzRJaeydAA23SYZqtRFiuCH");

        setMintLoading(false);
    };

    return (
        <>
            <button
                onClick={() => fetchData("ipfs://QmaAAjPP96m1d7VvKUWu84PhzRJaeydAA23SYZqtRFiuCH")}
            >
                mint
            </button>
            <Tooltip
                title={
                    user?.tokens >= 10
                        ? "Click to turn your model into NFT"
                        : "You need atleast 10 tokens to mint"
                }
                placement="left"
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
                    {mintLoading ? "Launching..." : `${download !== "no" ? "Launch + " : ""}Mint`}
                </Button>
            </Tooltip>

            {contractRes && (
                <Modal
                    open={!!contractRes}
                    onClose={() => setContractRes(null)}
                    heading={"Your NFT is successfully minted."}
                >
                    <Typography variant="body1" color={"#FFFFFF"}>
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
