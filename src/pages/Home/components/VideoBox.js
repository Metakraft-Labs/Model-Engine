import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import { Box } from "@mui/material";
import React from "react";
import astro from "../../../assets/img/dashboard/astro.png";

export default function VideoBox() {
    return (
        <Box
            sx={{
                backgroundColor: "#101111",
                borderRadius: 7,
                border: 1,
                borderColor: "#373737",
                textAlign: "center",
                // justifyContent: "left",
                dispaly: "flex",
                backgroundImage: `url(${astro}) `,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                width: "50%",
                height: "90px",
                boxShadow: " 0px 0px 0px 6px rgba(0, 0, 0, 1)",
                pt: 21,
                pl: 2,
                pb: 2,
            }}
        >
            <Box
                sx={{
                    justifyContent: "center", // Center the icon horizontally within the child Box
                    alignItems: "center", // Center the icon vertically within the child Box
                    background:
                        "linear-gradient(to bottom, rgba(27, 28, 31, 0.7), rgba(35, 38, 40, 0.7))",
                    width: "14%",
                    p: 1.5,
                    display: "flex",
                    flexWrap: "wrap",
                    border: 1,
                    borderColor: "#2d2e31", //linear-gradient(to top, rgba(45, 46, 49,1), rgba(45, 46, 49,1))
                    borderRadius: 6,
                }}
            >
                <PlayCircleFilledRoundedIcon
                    sx={{
                        fontSize: 50,
                    }}
                />
            </Box>
        </Box>
    );
}
