import { Box, Button, TextField } from "@mui/material";
import React, { useState } from "react";
import { generate } from "../../apis/text23d";
import Title from "../../shared/Title";
import DisplayModel from "./DisplayModel";

export default function Text23D() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState(null);

    const generateModel = async e => {
        setLoading(true);
        e.preventDefault();

        const res = await generate(prompt);

        if (res) {
            setModel(res?.glbUrl);
        }

        setLoading(false);
    };

    return (
        <>
            <Title title={"Text 2 3D"} />
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
                        width={"980px"}
                        sx={{ border: "1px solid #E8DECF" }}
                        borderRadius={"10px"}
                        flex={"1"}
                    >
                        {model && <DisplayModel link={model} />}
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
                {model && <Button onClick={() => (window.location.href = model)}>Download</Button>}
            </Box>
        </>
    );
}
