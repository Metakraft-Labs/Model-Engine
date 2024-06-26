import { Box, Button } from "@mui/material";
import { styled } from "@mui/system";
import ball from "../../assets/img/login/ball.png";
import bg_avatar from "../../assets/img/login/bg_avatar.png";

export const Background = styled(Box)({
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

export const FormContainer = styled(Box)({
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

export const AvatarImage = styled("img")({
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    marginBottom: 1,
});

export const CustomButton = styled(Button)({
    backgroundColor: "#6c63ff",
    marginTop: "20px",
    "&:hover": {
        backgroundColor: "#5a54d4",
    },
});
