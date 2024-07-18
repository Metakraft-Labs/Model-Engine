import { Box, Button, LinearProgress, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getModel } from "../../apis/text23d";
import bg from "../../assets/img/text-2-3d/bg.svg";
import DisplayModel from "../../components/DisplayModel";
import Title from "../../shared/Title";

export default function ModelViewer() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [_, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState(null);
    const [objModel, setObjModel] = useState(null);

    const id = useMemo(() => {
        // get query string
        const params = new URLSearchParams(searchParams);
        const id = params.get("id");

        return id;
    }, [searchParams]);

    const fetchFile = useCallback(async () => {
        setModel(null);
        setObjModel(null);
        setImageUrl(null);
        setLoading(true);
        if (id) {
            const res = await getModel({ id });
            setModel(res?.glbUrl);
            setObjModel(res?.objUrl);
            setImageUrl(res?.image);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchFile();
    }, [fetchFile]);

    return (
        <>
            <Title title={"Model Viewer"} />
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
                    height: "100svh",
                    backgroundImage: `url(${bg})`, // Replace with your image URLs
                    backgroundPosition: "top left, bottom right", // Positions
                    backgroundSize: "cover, cover", // First image covers the box, second image is 100x100 pixels
                    backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
                }}
            >
                <Box display="flex" justifyContent={"end"} width={"100%"} zIndex={99}>
                    <Button
                        onClick={() => navigate("/")}
                        sx={{
                            border: 1,
                            borderColor: "#746380",
                            mr: 2,
                            backgroundColor: "#B054F8",
                            color: "white",
                            borderRadius: "12px",
                            boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",
                            padding: theme => theme.spacing(1.5, 3),
                            textTransform: "none",
                            "&:hover": {
                                backgroundColor: "#B054F8",
                            },
                            cursor: "pointer",
                        }}
                    >
                        Try for free
                    </Button>
                </Box>
                <Box display={"flex"} height={"100%"} width={"100%"} alignItems={"center"}>
                    <Box height={"100%"} width={"100%"}>
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
                        {model && <DisplayModel link={model} type={"textured"} obj={objModel} />}
                    </Box>
                </Box>
            </Box>
        </>
    );
}
