import { Avatar, Box, Button, Typography } from "@mui/material";
import React from "react";
import memoji1 from "../../../assets/img/dashboard/memoji1.png";
import memoji2 from "../../../assets/img/dashboard/memoji2.png";
import memoji3 from "../../../assets/img/dashboard/memoji3.png";
import memoji4 from "../../../assets/img/dashboard/memoji4.png";
import zap from "../../../assets/img/dashboard/zap.png";

export default function Invite() {
    return (
        <Box
            sx={{
                backgroundColor: "#101111",
                borderRadius: 7,
                border: 1,
                borderColor: "#373737",
                pl: 2.5,
                py: 3,
                width: "50%",
                height: "220px",
                boxShadow: " 0px 0px 0px 3px rgba(0, 0, 0, 1)",
                overflow: "hidden",
            }}
        >
            <img style={{ width: "24px", height: "26px" }} src={zap} alt="zap" />

            <Typography sx={{ fontSize: "18px", mt: 0.8, mb: 0.5 }}>
                Invite family, friends, anyone
            </Typography>
            <Typography sx={{ fontSize: "16px", mb: 0.8 }} color="#787878">
                Invite family, friends or others to earn KRAFT
            </Typography>
            <Box sx={{ mt: 2, display: "flex" }}>
                <Avatar src={memoji1} sx={{ mx: 2, width: 48, height: 48 }} />
                <Avatar src={memoji2} sx={{ mx: -3, width: 48, height: 48 }} />
                <Avatar src={memoji3} sx={{ mx: 2, width: 48, height: 48 }} />
                <Avatar src={memoji4} sx={{ mx: -3, width: 48, height: 48 }} />
            </Box>
            <Button
                fullWidth
                variant="text"
                sx={{
                    mt: 2,

                    width: "95%",
                    backgroundColor: "#1e1f1f",
                    borderRadius: "500px",
                    textTransform: "none",
                }}
            >
                <Typography color="white" sx={{ fontSize: "18px", mt: 0.8, mb: 0.8 }}>
                    Invite
                </Typography>
            </Button>
        </Box>
    );
}
