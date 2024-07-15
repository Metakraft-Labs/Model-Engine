import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Box, Button, Slider, TextField, Typography } from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { generate } from "../../apis/text2texture";
import bg_grad from "../../assets/img/account/bg_grad.png";
import UploadToIpfs from "../../components/UploadToIPFS/index";
import UserStore from "../../contexts/UserStore";
import Title from "../../shared/Title";
import { urlToFile } from "../../shared/files";
import { BackLink } from "../Auth/styles";

const defaultSettings = {
    exposure: 50,
    saturation: 50,
    contrast: 50,
    temperature: 50,
    highlight: 50,
};

export default function Text2Texture() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setTexture] = useState(null);
    const [byteRes, setByteRes] = useState(null);
    const { userWallet } = useContext(UserStore);
    const [selectedSize, setSelectedSize] = useState(1080);

    const generateModel = async e => {
        setTexture(null);
        setLoading(true);
        e.preventDefault();

        const res = await generate(prompt, selectedSize);

        if (res) {
            const byteRes = await urlToFile(res);
            const linkIPFS = await UploadToIpfs(byteRes.file, "Text2Texture");
            setByteRes(linkIPFS);
            setTexture(res);
            setImage(res);
            resetFilters();
        }

        setLoading(false);
    };

    const [image, setImage] = useState("");
    const [filters, setFilters] = useState(defaultSettings);
    // const [exposure, setExposure] = useState(50);
    // const [saturation, setSaturation] = useState(50);
    // const [contrast, setContrast] = useState(50);
    // const [temperature, setTemperature] = useState(50);
    // const [highlight, setHighlight] = useState(50);
    const canvasRef = useRef(null);

    const applyFilters = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = image;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            // Apply filters (simplified for demonstration)
            ctx.globalAlpha = filters.exposure / 100;
            ctx.filter = `
          saturate(${filters.saturation / 50}) 
          contrast(${filters.contrast / 50}) 
          brightness(${filters.temperature / 50})
          sepia(${filters.highlight / 100})
        `;
            ctx.drawImage(img, 0, 0);
        };
    };

    useEffect(() => {
        if (image) {
            applyFilters();
        }
    }, [image, filters]);

    const handleDownload = () => {
        try {
            const link = document.createElement("a");
            link.download = "image.png";

            // Create a temporary canvas element to work with
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");

            // Create an image element to load the model URL
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = model; // Use the already generated model URL
            img.onload = () => {
                // Set the dimensions of the temporary canvas based on selectedSize
                const size = selectedSize === 512 ? 512 : selectedSize === 712 ? 712 : 1080;
                tempCanvas.width = size;
                tempCanvas.height = size;

                // Draw the image onto the temporary canvas
                tempCtx.drawImage(img, 0, 0, size, size);

                // Apply filters (similar to the applyFilters function)
                tempCtx.globalAlpha = filters.exposure / 100;
                tempCtx.filter = `
                    saturate(${filters.saturation / 50}) 
                    contrast(${filters.contrast / 50}) 
                    brightness(${filters.temperature / 50})
                    sepia(${filters.highlight / 100})
                `;
                tempCtx.drawImage(img, 0, 0, size, size);

                // Set the generated data URL as href and trigger download
                link.href = tempCanvas.toDataURL();
                link.click();

                // Clean up temporary resources if necessary
                tempCanvas.remove();
            };
        } catch (err) {
            console.error("Failed to download:", err);
        }
    };

    const resetFilters = () => {
        setFilters(defaultSettings);
    };

    const handlePromptChange = e => {
        setPrompt(e.target.value);
        resetFilters(); // Reset filters when prompt changes
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
                            Back
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
                            flexDirection: "row",
                            width: "100%",
                            height: "90%",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                width: "200px",
                                padding: "20px",
                                backgroundColor: "#2e2e3e",
                                borderRadius: "8px",
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Texture Settings
                            </Typography>
                            <ButtonGroup setSelectedSize={setSelectedSize} />
                            <SettingsSlider
                                title="Exposure"
                                value={filters.exposure}
                                onChange={value =>
                                    setFilters(prev => ({
                                        ...prev,
                                        exposure: value,
                                    }))
                                }
                            />
                            <SettingsSlider
                                title="Saturation"
                                value={filters.saturation}
                                onChange={value =>
                                    setFilters(prev => ({
                                        ...prev,
                                        saturation: value,
                                    }))
                                }
                            />
                            <SettingsSlider
                                title="Contrast"
                                value={filters.contrast}
                                onChange={value =>
                                    setFilters(prev => ({
                                        ...prev,
                                        contrast: value,
                                    }))
                                }
                            />
                            <SettingsSlider
                                title="Temperature"
                                value={filters.temperature}
                                onChange={value =>
                                    setFilters(prev => ({
                                        ...prev,
                                        temperature: value,
                                    }))
                                }
                            />
                            <SettingsSlider
                                title="Highlight"
                                value={filters.highlight}
                                onChange={value =>
                                    setFilters(prev => ({
                                        ...prev,
                                        highlight: value,
                                    }))
                                }
                            />
                        </Box>
                        <Box
                            sx={{
                                width: "300px",
                                height: "300px",
                                display: "flex",
                                justifyContent: "start",
                                alignItems: "start",
                                overflow: "hidden",
                            }}
                        >
                            {/* {model && <img src={model} alt="React Image" height="100%" />} */}

                            {/* <ReactImagePickerEditor
                                src={image}
                                config={{
                                    language: "en",
                                    width: "300px",
                                    height: "300px",
                                    objectFit: "cover",
                                    compressInitial: null,
                                    hideEditButton: false,
                                    isFreeStyleCropEnabled: true,
                                }}
                                imageSrcProp={image}
                                onSave={editedImage => setImage(editedImage)}
                                exposure={exposure}
                                saturation={saturation}
                                contrast={contrast}
                                temperature={temperature}
                                highlight={highlight}
                            /> */}
                            <canvas ref={canvasRef}></canvas>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            width: "70%",
                            p: 1,
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                width: "100%",
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
                                    onChange={handlePromptChange}
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
                        {model && byteRes && userWallet ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
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
                                    //onClick={() => (window.location.href = model)}
                                    onClick={handleDownload}
                                >
                                    <FileDownloadIcon
                                        sx={{
                                            fontSize: 30,
                                        }}
                                    />
                                </Button>
                            </Box>
                        ) : (
                            <></>
                        )}
                    </Box>
                </Box>
            </Box>
        </>
    );
}

const SettingsSlider = ({ title, value, onChange }) => {
    return (
        <Box sx={{ marginBottom: "2px" }}>
            <Typography>{title}</Typography>
            <Slider
                value={value}
                onChange={(e, newValue) => onChange(newValue)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                sx={{ color: "#ff77e9" }}
            />
        </Box>
    );
};

const ButtonGroup = ({ setSelectedSize }) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
            }}
        >
            <Button
                variant="contained"
                sx={{ backgroundColor: "#2e2e3e", color: "#fff", marginRight: "10px" }}
                onClick={() => setSelectedSize(512)}
            >
                512px
            </Button>
            <Button
                variant="contained"
                sx={{ backgroundColor: "#2e2e3e", color: "#fff", marginRight: "10px" }}
                onClick={() => setSelectedSize(712)}
            >
                712px
            </Button>
            <Button
                variant="contained"
                sx={{ backgroundColor: "#2e2e3e", color: "#fff" }}
                onClick={() => setSelectedSize(1080)}
            >
                1080px
            </Button>
        </Box>
    );
};
