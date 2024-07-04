import { Box, Button } from "@mui/material";
import { styled } from "@mui/system";
import { Link } from "react-router-dom";
import ball from "../../assets/img/login/ball.png";
import bg_avatar from "../../assets/img/login/bg_avatar.png";

export const Background = styled(Box)({
    display: "flex",
    alignItems: "center",
    justifyContent: "left",
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
    background: "linear-gradient(155deg, #1B1B1B 1.92%, #1F273F 94.82%)",
    padding: 30,
    borderRadius: 25,
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    maxWidth: "250px",
    width: "100%",
});

export const AvatarImage = styled("img")({
    width: "69px",
    height: "74px",
    borderRadius: "50%",
});

export const CustomButton = styled(Button)({
    backgroundColor: "#B054F8",
    border: "2px solid #7A46AD",
    borderRadius: 10,
    marginTop: "20px",
    textTransform: "none",
    "&:hover": {
        backgroundColor: "#4E3562",
    },
});

export const BackLink = styled(Link)({
    position: "absolute",
    top: "25px",
    left: "30px",
    color: "#fff",
    textDecoration: "none",
    zIndex: 999,
});
