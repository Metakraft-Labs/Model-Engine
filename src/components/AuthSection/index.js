import { Box, Grid, Typography } from '@mui/material';
import React from 'react';
import logo from "../../assets/images/logo.png";

export default function AuthSection({ children, page, image, text }) {
    return (
        <Grid container gridTemplateColumns={"0.5fr 0.7fr"} justifyContent={"space-between"} sx={{ backgroundImage: "linear-gradient( 150deg, hsl(284deg 83% 73%) 0%, hsl(294deg 89% 69%) 52%, hsl(289deg 86% 71%) 72%, hsl(278deg 84% 71%) 82%, hsl(276deg 87% 68%) 89%, hsl(295deg 90% 67%) 100%)", height: "100vh", gap: { md: "4.4rem", lg: "6rem", xl: "7.8rem" }, overflow: "auto" }}>
            <Grid item xs={12} sm={12} md={4} xl={4} lg={4} sx={{ display: { xs: "none", md: "flex", sm: "none", lg: "flex" } }} flexDirection={"column"} alignItems={"center"} height={"100%"} width={"100%"} justifyContent={"center"}>
                <Typography sx={{ color: "#FFF", fontSize: "3.48938rem" }}>{page}</Typography>
                <img src={image} alt={"Login Image"} style={{ width: "26rem" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={7} xl={7} lg={7} display={"flex"} flexDirection={"column"} height={"100%"} width={"100%"} alignItems={"center"} justifyContent={"center"} sx={{ backgroundColor: { xs: "0", md: "#FFF", sm: "0", lg: "#FFF" }, overflow: "auto", borderRadius: { xs: "0", md: "2.5rem 0rem 0rem 2.5rem", sm: "0", lg: "2.5rem 0rem 0rem 2.5rem" } }}>
                <Box display={"flex"} alignItems={"center"} flexDirection={"column"} gap={"2rem"} borderRadius={"4.76906rem"} padding={"3.5625rem 7.4375rem"} width={"50%"} height={"80%"} sx={{ background: { xs: "rgba(217, 217, 217)", md: "rgba(217, 217, 217, 0.01)", sm: "rgba(217, 217, 217)", lg: "rgba(217, 217, 217, 0.01)" }, overflow: "auto", boxShadow: "0px 0.6358759999275208px 25.435039520263672px 0px rgba(227, 222, 255, 0.20) inset, 0px 2.543503999710083px 11.445768356323242px 0px rgba(154, 146, 210, 0.30) inset, 0px 62.31585693359375px 63.58759689331055px -30.522050857543945px rgba(202, 172, 255, 0.30) inset, 0px -52.1418342590332px 43.23957061767578px -40.69606399536133px rgba(96, 68, 144, 0.30) inset, 0px 4.451131820678711px 6.994636058807373px -2.543503999710083px #FFF inset, 0px 24.799163818359375px 35.60905456542969px -22.891536712646484px rgba(255, 255, 255, 0.50) inset, 0px 2.543503999710083px 2.543503999710083px 0px rgba(0, 0, 0, 0.25)", backdropFilter: "blur(31.793798446655273px)" }}>
                    <Box display={"flex"} gap={"1rem"} flexDirection={"column"} alignItems={"center"}>
                        <img src={logo} alt={"Fatex logo"} style={{ height: "4.3125rem", width: "8.625rem" }} />
                        <Typography fontSize={"1.50875rem"} fontWeight={"600"} sx={{ color: "#81379C" }}>{text}</Typography>
                    </Box>
                    {children}
                </Box>
            </Grid>
        </Grid>
    )
};