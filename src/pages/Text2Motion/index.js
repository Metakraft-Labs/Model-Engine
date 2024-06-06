import { Box, Button, TextField } from "@mui/material";
import React, { useContext, useState } from "react";
import { generate } from "../../apis/text2motion";
import CreateNFT from "../../components/CreateNFT/index";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";

export default function Text2Motion() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setMotion] = useState(null);
    const [byteRes, setByteRes] = useState(null);

    const { userWallet } = useContext(UserStore);

    const generateModel = async e => {
        setMotion(null);
        setLoading(true);
        e.preventDefault();

        const res = await generate(prompt);

        if (res) {
            const byteRes = await urlToFile(res);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text2Motion");
            setByteRes(linkIPFS);
            setMotion(res);
        }

        setLoading(false);
    };

    return (
        <>
            <Title title={"Text 2 Motion"} />
            <Box
                display={"flex"}
                gap={"20px"}
                alignItems="start"
                width={"100%"}
                pl={"6rem"}
                height={"80vh"}
            >
                <Box
                    display={"flex"}
                    height={"100%"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    flexDirection={"column"}
                    gap={"40px"}
                    width={"100%"}
                >
                    <Box
                        height={"20rem"}
                        width={"500px"}
                        sx={{ border: "1px solid #E8DECF" }}
                        borderRadius={"10px"}
                        flex={"1"}
                        paddingLeft={"20px"}
                    >
                        {model && <video controls height="100%" src={model}></video>}
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
                    <div>
                        <Button onClick={() => (window.location.href = model)}>Download</Button>
                        <CreateNFT fileURI={byteRes} url={model} type={"motion"} prompt={prompt} />
                    </div>
                ) : (
                    <></>
                )}
            </Box>
        </>
    );
}
