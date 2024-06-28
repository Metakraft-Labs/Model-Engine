import { Box, Button, TextField } from "@mui/material";
import React, { useContext, useState } from "react";
import { generate } from "../../apis/text2texture";
import CreateNFT from "../../components/CreateNFT/index";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";

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
                    gap: "20px",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "center",
                    height: "90vh",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        width: "90%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                        gap: "40px",
                    }}
                >
                    <Box
                        sx={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            border: "1px solid #E8DECF",
                            flex: "1",
                            pl: "20px",
                        }}
                    >
                        {model && <img src={model} alt="React Image" height="100%" />}
                    </Box>
                    <form style={{ width: "100%" }} onSubmit={generateModel}>
                        <Box display={"flex"} alignItems={"center"} gap={"20px"} width={"100%"}>
                            <TextField
                                color="success"
                                fullWidth
                                variant="outlined"
                                placeholder="Enter prompt"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                color="success"
                                sx={{ height: "100%" }}
                                disabled={loading}
                                type="submit"
                            >
                                Enter
                            </Button>
                        </Box>
                    </form>
                </Box>
                {model && byteRes && userWallet ? (
                    <Box>
                        <Button onClick={() => (window.location.href = model)}>Download</Button>
                        <CreateNFT fileURI={byteRes} url={model} type={"texture"} prompt={prompt} />
                    </Box>
                ) : (
                    <></>
                )}
            </Box>
        </>
    );
}
