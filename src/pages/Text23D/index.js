import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, LinearProgress, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { animate, generate, preRig, refine, rig, stylize } from "../../apis/text23d";
import { upload } from "../../apis/upload";
import bg from "../../assets/img/text-2-3d/bg.svg";
import DisplayModel from "../../components/DisplayModel";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import { UserStore } from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";
import Leftbar from "./components/Leftbar";
import Navbar from "./components/Navbar";
import Rightbar from "./components/Rightbar";

export default function Text23D() {
    const { updateUser } = useContext(UserStore);
    const [prompt, setPrompt] = useState("");
    const [image, setImage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState(null);
    const [refinedModel, setRefinedModel] = useState(null);
    const [stylizedModel, setStylizedModel] = useState(null);
    const [riggedModel, setRiggedModel] = useState(null);
    const [animatedModel, setAnimatedModel] = useState(null);
    const [byteRes, setByteRes] = useState(null);
    const [selectedTab, setSelectedTab] = useState("textured");
    const [mode, setMode] = useState("text");
    const [quality, setQuality] = useState("normal");
    const [modelId, setModelId] = useState(null);
    const [showModel, setShowModel] = useState("draft");
    const [selectedStyle, setSelectedStyle] = useState("");

    const generateModel = async e => {
        setModel(null);
        setImageUrl(null);
        setLoading(true);
        e.preventDefault();
        let resImage = "";

        if (mode === "image" && quality === "normal") {
            resImage = await upload(image, "images");
        }
        let res;

        if (quality === "advanced" && mode === "image") {
            res = await generate({ file: image, type: mode, quality });
        } else {
            res = await generate({ prompt, quality, type: mode, image: resImage });
        }

        if (res?.glbUrl) {
            setShowModel("draft");
            const byteRes = await urlToFile(res?.glbUrl);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text23D");
            setByteRes(linkIPFS);
            setModelId(res?.id);
            setModel(res?.glbUrl);
            setImageUrl(res?.image);
        }
        await updateUser();

        setLoading(false);
    };

    const refineModel = async e => {
        setLoading(true);
        e.preventDefault();
        if (quality === "normal" || !modelId) {
            toast.error("This model cannot be refined");
            setLoading(false);
            return;
        }

        const res = await refine(modelId);

        if (res) {
            setShowModel("refined");
            setRefinedModel(res);
        }
        await updateUser();

        setLoading(false);
    };

    const stylizeModel = async (e, style) => {
        setLoading(true);
        e.preventDefault();
        if (quality === "normal" || !modelId) {
            toast.error("This model cannot be stylize");
            setLoading(false);
            return;
        }

        const res = await stylize(modelId, style);

        if (res) {
            setSelectedStyle(style);
            setShowModel("stylized");
            setStylizedModel(res);
        }
        await updateUser();

        setLoading(false);
    };

    const rigModel = async e => {
        setLoading(true);
        e.preventDefault();
        if (quality === "normal" || !modelId) {
            toast.error("This model cannot be rigged");
            setLoading(false);
            return;
        }

        const res = await preRig(modelId);

        if (res) {
            const model = await rig(modelId);
            if (model) {
                setShowModel("rigged");
                setRiggedModel(model);
            }
        } else {
            toast.error("This model cannot be rigged");
            setLoading(false);
            return;
        }
        await updateUser();

        setLoading(false);
    };

    const animateModel = async (e, animation) => {
        setLoading(true);
        e.preventDefault();
        if (quality === "normal" || !modelId) {
            toast.error("This model cannot be animated");
            setLoading(false);
            return;
        }

        const res = await animate(modelId, animation);

        if (res) {
            setShowModel("animated");
            setAnimatedModel(res);
        }
        await updateUser();

        setLoading(false);
    };

    return (
        <>
            <Title title={"Text 2 3D"} />
            <Box
                display={"flex"}
                flexDirection={"column"}
                sx={{
                    pt: 6,
                    pb: 8,
                    px: 4,
                    gap: 0.8,
                    backgroundColor: "#11141D",
                    color: "white",
                    width: "100%",
                    height: "100dvh",
                    backgroundImage: `url(${bg})`, // Replace with your image URLs
                    backgroundPosition: "top left, bottom right", // Positions
                    backgroundSize: "cover, cover", // First image covers the box, second image is 100x100 pixels
                    backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
                }}
            >
                <Box display={"flex"} alignItems={"center"} zIndex={999}>
                    <Link
                        to="/"
                        style={{
                            color: "#fff",
                            textDecoration: "none",
                            flex: 0.5,
                        }}
                    >
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
                    </Link>
                    <Navbar
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                        model={model}
                        byteRes={byteRes}
                        prompt={prompt}
                        imageUrl={imageUrl}
                        setMode={setMode}
                        id={modelId}
                    />
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                    <Leftbar
                        model={model}
                        mode={mode}
                        quality={quality}
                        setMode={setMode}
                        setQuality={setQuality}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        image={image}
                        setImage={setImage}
                        loading={loading}
                        generateModel={generateModel}
                    />
                    <Box height="100%" flex={1}>
                        {loading && (
                            <Box
                                height={"100%"}
                                width={"100%"}
                                display={"flex"}
                                justifyContent={"center"}
                                alignItems={"center"}
                            >
                                <Box
                                    display={"flex"}
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                    gap={"20px"}
                                    width={"500px"}
                                    flexDirection={"column"}
                                    padding={"15px 30px"}
                                    sx={{
                                        background: "#000000",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <Typography fontWeight={700} fontSize={"18px"}>
                                        Generating your model
                                    </Typography>
                                    <LinearProgress
                                        sx={{
                                            width: "100%",
                                            "& .MuiLinearProgress-bar": {
                                                background: "#9D43E3",
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}
                        {model && !loading && (
                            <DisplayModel
                                link={
                                    showModel === "draft"
                                        ? model
                                        : showModel === "refined" && refinedModel
                                          ? refinedModel
                                          : showModel === "stylized" && stylizedModel
                                            ? stylizedModel
                                            : showModel === "rigged" && riggedModel
                                              ? riggedModel
                                              : showModel === "animated" && animatedModel
                                                ? riggedModel
                                                : model
                                }
                                type={selectedTab}
                                style={selectedStyle}
                            />
                        )}
                    </Box>
                    {model && quality === "advanced" && (
                        <Rightbar
                            refinedModel={refinedModel}
                            riggedModel={riggedModel}
                            loading={loading}
                            rigModel={rigModel}
                            refineModel={refineModel}
                            stylizeModel={stylizeModel}
                            animateModel={animateModel}
                        />
                    )}
                </Box>
            </Box>
        </>
    );
}
