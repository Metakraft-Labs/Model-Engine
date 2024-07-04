import InfoIcon from "@mui/icons-material/Info";
import { Alert, Badge, Box, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import { FiUploadCloud } from "react-icons/fi";

export default function ImageContent({ image, setImage, loading }) {
    const ref = useRef(null);
    const [displayImage, setDisplayImage] = useState(null);

    const imageChange = e => {
        if (e.target.files?.length) {
            var reader = new FileReader();
            reader.onload = f => {
                setImage(e.target.files[0]);
                setDisplayImage(f.target.result);
            };

            reader.readAsDataURL(e.target.files[0]);
        } else {
            setDisplayImage(null);
            setImage(null);
        }
    };

    return (
        <Box display={"flex"} gap={"20px"} flexDirection={"column"}>
            <Alert icon={<InfoIcon />} severity="warning" variant="filled">
                Please upload an image featuring a single complete object in a front view against a
                clear background
            </Alert>
            <input
                type="file"
                ref={ref}
                value={image?.fileName}
                onChange={imageChange}
                formEncType="multipart/form-data"
                style={{ display: "none" }}
                accept=".png"
                disabled={loading}
            />

            <Box
                display={"flex"}
                flexDirection={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                border={"1px solid #646464"}
                gap={"10px"}
                sx={{
                    background: "#1F1F1F",
                    cursor: "pointer",
                    "&:hover": {
                        background: "rgba(0,0,0,0.9)",
                    },
                }}
                padding={"40px 15px"}
                borderRadius={"10px"}
                onClick={() => ref.current.click()}
            >
                {image ? (
                    <img height={"100px"} width={"100px"} src={displayImage} />
                ) : (
                    <>
                        <Box height={"47px"}>
                            <Badge
                                badgeContent={<FiUploadCloud size={"27px"} />}
                                sx={{
                                    "& .MuiBadge-badge": {
                                        background: "#000000",
                                        height: "47px",
                                        width: "47px",
                                        borderRadius: "50%",
                                    },
                                }}
                            />
                        </Box>
                        <Typography color={"#BBBBBB"}>
                            Drag and drop image here or click to upload
                        </Typography>
                        <Typography color={"#BBBBBB"} textAlign={"center"} fontSize={"14px"}>
                            Supported image format: PNG (max. image size 10MB)
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}
