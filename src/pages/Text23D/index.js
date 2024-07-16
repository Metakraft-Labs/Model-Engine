import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, Button, LinearProgress, MenuItem, Select, Typography } from "@mui/material";
import React, { useContext, useMemo, useState } from "react";
import { FaBars } from "react-icons/fa6";
import { RiGalleryFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import { generate } from "../../apis/text23d";
import { upload } from "../../apis/upload";
import bg from "../../assets/img/text-2-3d/bg.svg";
import lightBulb from "../../assets/img/text-2-3d/light-bulb.png";
import DisplayModel from "../../components/DisplayModel";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";
import Navbar from "./Navbar";
import ImageContent from "./components/ImageContent";
import TextContent from "./components/TextContent";

export default function Text23D() {
    const { updateUser } = useContext(UserStore);
    const [prompt, setPrompt] = useState("");
    const [image, setImage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState(null);
    const [objModel, setObjModel] = useState(null);
    const [byteRes, setByteRes] = useState(null);
    const [selectedTab, setSelectedTab] = useState("textured");
    const [mode, setMode] = useState("text");
    const [quality, setQuality] = useState("normal");

    const models = useMemo(() => {
        if (model && objModel) {
            return [
                {
                    name: "glb",
                    link: model,
                },
                {
                    name: "obj",
                    link: objModel,
                },
            ];
        }
    }, [model, objModel]);

    const generateModel = async e => {
        setModel(null);
        setObjModel(null);
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
            const byteRes = await urlToFile(res?.glbUrl);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text23D");
            setByteRes(linkIPFS);
            setModel(res?.glbUrl);
            setObjModel(res?.objUrl);
            setImageUrl(res?.image);
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
                    height: "fit-content",
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
                        models={models}
                        byteRes={byteRes}
                        prompt={prompt}
                        imageUrl={imageUrl}
                    />
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                    <Box
                        height="545px"
                        display={"flex"}
                        flexDirection={"column"}
                        border="1px solid #E18BFF"
                        width={"374px"}
                        borderRadius={"23px"}
                        padding={"23px 17px 23px 30px"}
                        sx={{
                            zIndex: 99,
                            boxShadow: "0px 0px 0px 3px #000000",
                            backgroundColor: "#000000",
                            backgroundImage: `url(${lightBulb})`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                        }}
                    >
                        <Box display={"flex"} flexDirection={"column"} gap={"20px"} flex={1}>
                            <Typography fontWeight={500} fontSize={"18px"}>
                                Generate 3D
                            </Typography>
                            <Box
                                display={"flex"}
                                justifyContent={"space-around"}
                                alignItems={"center"}
                            >
                                <Box
                                    display="flex"
                                    gap="3px"
                                    alignItems="center"
                                    onClick={() => setMode("image")}
                                    sx={{ cursor: "pointer" }}
                                    color={mode === "image" ? "#FFFFFF" : "#B6B6B6"}
                                >
                                    <RiGalleryFill />
                                    <Typography>Image to 3D</Typography>
                                </Box>
                                <Box
                                    display="flex"
                                    gap="3px"
                                    alignItems="center"
                                    onClick={() => setMode("text")}
                                    sx={{ cursor: "pointer" }}
                                    color={mode === "text" ? "#FFFFFF" : "#B6B6B6"}
                                >
                                    <FaBars />
                                    <Typography>Text to 3D</Typography>
                                </Box>
                            </Box>

                            {mode === "text" ? (
                                <TextContent prompt={prompt} setPrompt={setPrompt} />
                            ) : (
                                <ImageContent image={image} setImage={setImage} loading={loading} />
                            )}
                        </Box>
                        <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                            gap={"10px"}
                            alignItems={"center"}
                        >
                            <Select
                                value={quality}
                                onChange={e => setQuality(e.target.value)}
                                sx={{
                                    border: "1px solid #B158F6",
                                    color: "#FFFFFF",
                                }}
                                size="small"
                            >
                                <MenuItem value={"normal"}>
                                    Quality - Normal | {mode === "text" ? "1" : "5"} credit
                                </MenuItem>
                                <MenuItem value={"advanced"}>
                                    Quality - Advanced | {mode === "text" ? "29" : "50"} credit
                                </MenuItem>
                            </Select>
                            <Button
                                sx={{
                                    backgroundColor: "#B054F8",
                                    color: "white",
                                    borderRadius: "12px",
                                    padding: theme => theme.spacing(1.5, 3),
                                    textTransform: "none",
                                    "&:hover": {
                                        backgroundColor: "#B054F8",
                                        boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",
                                    },
                                }}
                                onClick={e => generateModel(e)}
                                disabled={
                                    (mode === "image" && !image) ||
                                    (mode === "text" && !prompt) ||
                                    loading
                                }
                            >
                                Generate
                            </Button>
                        </Box>
                    </Box>

                    <Box height="100%">
                        {loading && (
                            <Box
                                height={"100%"}
                                width={"100%"}
                                ml={"15%"}
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
                        {model && <DisplayModel link={model} type={selectedTab} obj={objModel} />}
                    </Box>
                </Box>
            </Box>
        </>
    );
}
