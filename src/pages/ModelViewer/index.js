import { Box, Button } from "@mui/material";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CreateNFT from "../../components/CreateNFT";
import DisplayModel from "../../components/DisplayModel";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";

export default function ModelViewer() {
    const [searchParams] = useSearchParams();

    const [byteRes, setByteRes] = useState(null);

    const { userWallet } = useContext(UserStore);

    const [url, prompt] = useMemo(() => {
        // get query string
        const params = new URLSearchParams(searchParams);
        const url = params.get("url");
        const prompt = params.get("prompt");

        return [url, prompt];
    }, [searchParams]);

    const fetchFile = useCallback(async () => {
        if (url) {
            const byteRes = await urlToFile(url);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text23D");
            setByteRes(linkIPFS);
        }
    }, [url]);

    useEffect(() => {
        fetchFile();
    });

    return (
        <>
            <Title title={"Model Viewer"} />
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
                    width={"90%"}
                >
                    <Box
                        height={"20rem"}
                        width={"900px"}
                        sx={{ border: "1px solid #E8DECF" }}
                        borderRadius={"10px"}
                        flex={"1"}
                    >
                        {url && <DisplayModel link={url} />}
                    </Box>
                </Box>
                {url && byteRes && userWallet ? (
                    <div>
                        <Button onClick={() => (window.location.href = url)}>Download</Button>
                        <CreateNFT fileURI={byteRes} url={url} type={"3d"} prompt={prompt} />
                    </div>
                ) : (
                    <></>
                )}
            </Box>
        </>
    );
}
