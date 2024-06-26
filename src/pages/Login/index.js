import { Box, Button, Container, Grid, Link, TextField, Typography } from "@mui/material";
import { styled } from "@mui/system";
import React from "react";
import ball from "../../assets/img/login/ball.png";
import bg_avatar from "../../assets/img/login/bg_avatar.png";
import metakraft from "../../assets/img/login/metakraft.png";
import Title from "../../shared/Title";

const Background = styled(Box)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#11141D",
    backgroundImage: `url(${ball}), url(${bg_avatar}) `,
    backgroundPosition: "bottom left, bottom right",
    backgroundSize: "contain, contain",
    backgroundRepeat: "no-repeat, no-repeat",
    pr: 50,
});

const FormContainer = styled(Box)({
    backgroundColor: "#2c2c2c",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: "300px",
    width: "100%",
});

const AvatarImage = styled("img")({
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    marginBottom: 1,
});

const CustomButton = styled(Button)({
    backgroundColor: "#6c63ff",
    marginTop: "20px",
    "&:hover": {
        backgroundColor: "#5a54d4",
    },
});

export default function Login() {
    return (
        <>
            <Title title={"Login"} />
            <Background>
                <Container component="main" maxWidth="lg">
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item xs={12} sm={8} md={6}>
                            <FormContainer>
                                <AvatarImage src={metakraft} alt="Avatar" />
                                <Typography variant="h6" component="h1" color="white" gutterBottom>
                                    Welcome to Spark AI
                                </Typography>
                                <Typography
                                    variant="caption"
                                    component="h1"
                                    color="#898A8C"
                                    gutterBottom
                                >
                                    Enter your email to get started.
                                </Typography>
                                <TextField
                                    variant="outlined"
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    InputLabelProps={{
                                        style: { color: "#fff" },
                                    }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                    }}
                                />
                                <CustomButton
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                >
                                    Continue
                                </CustomButton>
                                <Typography
                                    variant="body2"
                                    color="white"
                                    align="center"
                                    marginTop="20px"
                                >
                                    or
                                </Typography>
                                <CustomButton
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    style={{ backgroundColor: "#0088cc" }}
                                >
                                    Continue with Telegram
                                </CustomButton>
                                <Typography
                                    variant="body2"
                                    color="white"
                                    align="center"
                                    marginTop="20px"
                                >
                                    By continuing, you agree to our{" "}
                                    <Link href="#" color="inherit" underline="always">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="#" color="inherit" underline="always">
                                        Privacy Policy
                                    </Link>
                                    .
                                </Typography>
                            </FormContainer>
                        </Grid>
                    </Grid>
                </Container>
            </Background>

            {/* <Box
                sx={{
                    display: "flex",
                    backgroundColor: "#11141D",
                    backgroundImage: `url(${ball}), url(${bg_avatar})`, // Replace with your image URLs
                    backgroundPosition: "bottom left, bottom right", // Positions
                    backgroundSize: "cover, cover",
                    backgroundRepeat: "no-repeat, no-repeat", // Prevents repeating
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 10,
                }}
            >
                afddsfasdfa
                <Box sx={{ display: "flex", width: "100%", height: "100%" }}></Box>
            </Box> */}
        </>
    );
}
