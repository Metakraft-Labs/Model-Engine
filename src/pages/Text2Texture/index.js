import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Button, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { generate } from "../../apis/text2texture";
import bg_grad from "../../assets/img/account/bg_grad.png";
import CreateNFT from "../../components/CreateNFT/index";
import DisplayModel from "../../components/DisplayModel";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";
import { BackLink } from "../Auth/styles";

export default function Text2Texture() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setTexture] = useState(null);
    const [byteRes, setByteRes] = useState(null);
    const { userWallet } = useContext(UserStore);

    const generateModel = async e => {
        setTexture(null);
        setLoading(true);
        e.preventDefault();

        const res = await generate(prompt);

        if (res) {
            const byteRes = await urlToFile(res);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text2Texture");
            setByteRes(linkIPFS);
            setTexture(res);
        }

        setLoading(false);
    };

    return (
        <>
            <Title title={"Text To Texture"} />
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "center",
                    background: "#000000",
                    backgroundImage: `url(${bg_grad})`,
                    backgroundPosition: "top left",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    height: "100vh",
                }}
            >
                <BackLink to="/">
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <ArrowBackIosNewIcon
                            sx={{
                                fontSize: 15,
                            }}
                        />
                        <Typography variant="body2" component="h1" color="#898A8C">
                            Back to Homepage
                        </Typography>
                    </Box>
                </BackLink>
                <Box
                    sx={{
                        display: "flex",
                        width: "80%",
                        height: "90%",
                        justifyContent: "start",
                        alignItems: "center",
                        flexDirection: "column",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            width: "100%",
                            height: "90%",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {model && <DisplayModel type="texture" link={model} />}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            width: "60%",
                            border: 1,
                            borderColor: "#E18BFF",
                            borderRadius: 2,
                            p: 1,
                        }}
                    >
                        <form
                            style={{
                                display: "flex",
                                width: "100%",
                                alignItems: "bottom",
                                justifyContent: "center",
                            }}
                            onSubmit={generateModel}
                        >
                            <TextField
                                fullWidth
                                variant="filled"
                                placeholder="Enter prompt &#40;eg. Mossy, Runic Brick, moss&#41;"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                sx={{
                                    width: "85%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    "& .MuiInputBase-input::placeholder": {
                                        color: "#bcbcbc",
                                        opacity: 0.6, // To make sure the color is fully applied
                                    },

                                    "& .MuiInputBase-input": {
                                        textAlign: "left",
                                        paddingTop: "10px", // Adjust this value to vertically center the text
                                    },
                                }}
                                InputProps={{
                                    style: {
                                        color: "#bcbcbc",
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                sx={{
                                    height: "100%",
                                    width: "15%",
                                    backgroundColor: "#E18BFF",
                                    "&:hover": {
                                        backgroundColor: "#4E3562",
                                    },
                                    "&:active": {
                                        backgroundColor: "#B054F8", // Color when button is being clicked
                                    },
                                }}
                                disabled={loading}
                                type="submit"
                            >
                                Generate
                            </Button>
                        </form>
                    </Box>
                </Box>
                {model && byteRes && userWallet ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            pr: 5,
                        }}
                    >
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: "#E18BFF",
                                "&:hover": {
                                    backgroundColor: "#4E3562",
                                },
                            }}
                            onClick={() => (window.location.href = model)}
                        >
                            Download
                        </Button>
                        <CreateNFT fileURI={byteRes} url={model} type={"texture"} prompt={prompt} />
                    </Box>
                ) : (
                    <></>
                )}
            </Box>
        </>
    );
}
