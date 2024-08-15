import {
    Box,
    Button,
    ButtonGroup,
    InputAdornment,
    Menu,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import React, { useState } from "react";
import CreateNFT from "../../../components/CreateNFT";
import { CoinIcon } from "../../../icons/CoinIcon";
import { USDCIconCircled } from "../../../icons/USDCIconCircled";
import ChangeLicenseModal from "./ChangeLicenseModal";

export default function MintDropdown({ open, handleClose, byteRes, url, prompt }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [download, setDownload] = useState("no");
    const [license, setLicense] = useState("free");
    const [additionalInfo, setAdditionalInfo] = useState({
        attribution: false,
        nonCommercial: false,
        nonDerivatives: false,
        shareAlike: false,
    });
    const [showChangeLicenseModal, setShowChangeLicenseModal] = useState(false);
    const [mintCost, setMintCost] = useState(0);

    const fieldStyle = {
        border: "1px solid #A557CA",
        background: "#000000",
        borderRadius: "7px",
        color: "#FFFFFF",
        mb: "10px",
        "& textarea": {
            color: "#FFFFFF",
        },
        "& [placeholder]": {
            color: "#FFFFFF",
        },
    };

    return (
        <Menu
            sx={{
                "& .MuiPaper-root": {
                    background: "#000000",
                    color: "#A5A5A5",
                    width: "278px",
                    borderRadius: "6px",
                    border: "1px solid #454646",
                    padding: "15px",
                },
            }}
            anchorEl={open}
            open={Boolean(open)}
            onClose={handleClose}
        >
            <TextField
                sx={fieldStyle}
                placeholder="Name"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
            />
            <TextField
                sx={fieldStyle}
                multiline
                rows={2}
                placeholder="Description"
                fullWidth
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <TextField
                sx={fieldStyle}
                placeholder="Tags (separated by commas)"
                fullWidth
                value={tags}
                onChange={e => setTags(e.target.value)}
            />

            <Typography
                sx={{
                    color: "#A8A8A8",
                }}
            >
                Allow minting?
            </Typography>

            <ButtonGroup
                variant={"outlined"}
                color={"secondary"}
                fullWidth
                sx={{
                    border: "1px solid #A557CA",
                    mb: "10px",
                    borderRadius: "8px",
                }}
            >
                <Tooltip title={"Your model will not be listed on the marketplace"} placement="top">
                    <Button
                        onClick={() => setDownload("no")}
                        variant={download === "no" ? "contained" : "outlined"}
                        sx={{
                            color: "#A8A8A8",
                            padding: "10px 15px",
                            border: "1px solid #A557CA",
                        }}
                    >
                        No
                    </Button>
                </Tooltip>
                <Tooltip
                    title={"Anyone would be able to mint your NFT for free on the marketplace"}
                    placement="top"
                >
                    <Button
                        onClick={() => setDownload("free")}
                        variant={download === "free" ? "contained" : "outlined"}
                        sx={{
                            padding: "10px 15px",
                            color: "#A8A8A8",
                            border: "1px solid #A557CA",
                        }}
                    >
                        Free
                    </Button>
                </Tooltip>
                <Tooltip title={"Sell your model as NFT on the marketplace"} placement="top">
                    <Button
                        onClick={() => setDownload("sell")}
                        variant={download === "sell" ? "contained" : "outlined"}
                        sx={{
                            padding: "10px 15px",
                            color: "#A8A8A8",
                            border: "1px solid #A557CA",
                        }}
                    >
                        Sell
                    </Button>
                </Tooltip>
            </ButtonGroup>

            {download !== "no" && (
                <Box>
                    <Typography
                        sx={{
                            color: "#A8A8A8",
                        }}
                    >
                        License
                    </Typography>
                    <Typography
                        sx={{
                            color: "#A8A8A8",
                            textAlign: "center",
                            fontWeight: 700,
                            textTransform: "capitalize",
                        }}
                    >
                        {license}
                    </Typography>
                    <Button
                        variant={"text"}
                        color={"secondary"}
                        fullWidth
                        onClick={() => setShowChangeLicenseModal(true)}
                    >
                        Change license
                    </Button>
                </Box>
            )}

            {download === "sell" && (
                <Box
                    display={"flex"}
                    width={"100%"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    mb={"10px"}
                >
                    <Typography
                        sx={{
                            color: "#A8A8A8",
                        }}
                    >
                        Set Price
                    </Typography>
                    <TextField
                        type={"number"}
                        min={1}
                        onChange={e => setMintCost(e.target.value)}
                        value={mintCost}
                        placeholder="Set price"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {<USDCIconCircled height="10" width="10" />}
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            background: "#000000",
                            border: "1px solid #A557CA",
                            width: "60%",
                            color: "#BABABA",
                            "& input": {
                                color: "#BABABA",
                            },
                            "& input::[placeholder]": {
                                color: "#BABABA",
                            },
                        }}
                    />
                </Box>
            )}

            <Box
                border={"1px solid #A557CA"}
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                padding={"10px 15px"}
                mb={"10px"}
                borderRadius={"8px"}
            >
                <Typography>Listing Price:</Typography>
                <Typography display={"flex"} gap={"10px"} alignItems={"center"}>
                    <CoinIcon /> 10
                </Typography>
            </Box>

            <CreateNFT
                name={name}
                description={description}
                fileURI={byteRes}
                url={url}
                type={"3d"}
                prompt={prompt}
                tags={tags
                    ?.split(",")
                    ?.filter(t => !!t)
                    ?.map(t => t?.trim())}
                download={download}
                mintCost={mintCost}
                license={`${license}${additionalInfo.attribution ? "-attribution required" : ""}${additionalInfo.nonCommercial ? "-non commercial" : ""}${additionalInfo.nonDerivatives ? "-no derivatives" : ""}${additionalInfo.shareAlike ? "-share alike" : ""}`}
            />
            <ChangeLicenseModal
                open={showChangeLicenseModal}
                onClose={() => setShowChangeLicenseModal(false)}
                license={license}
                setLicense={setLicense}
                additionalInfo={additionalInfo}
                setAdditionalInfo={setAdditionalInfo}
            />
        </Menu>
    );
}
