import { AppBar, Avatar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React from "react";
import { useNavigate } from "react-router-dom";
import spark from "../../assets/img/dashboard/spark.png";

const useStyles = makeStyles(theme => ({
    appBar: {
        backgroundColor: "rgba(32, 34, 36, 0.31)",
        borderRadius: 50,
        width: "60%",
    },
    toolbar: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
        alignItems: "center",
    },
    logo: {
        display: "flex",
        alignItems: "center",
    },
    navLinks: {
        display: "flex",
        gap: theme.spacing(4),
    },
    createButton: {
        backgroundColor: "#4E3562",
        color: "white",
        borderRadius: "12px",
        boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",

        padding: theme.spacing(1.5, 3),
        textTransform: "none",
        "&:hover": {
            backgroundColor: "#422658",
        },
    },
}));

export default function Navbar() {
    const classes = useStyles();
    const navigate = useNavigate();

    return (
        <AppBar
            position="static"
            className={classes.appBar}
            sx={{
                py: 2,

                border: 2,
                borderColor: "#37393c",
            }}
        >
            <Toolbar className={classes.toolbar}>
                <Box className={classes.logo}>
                    <img src={spark} alt="Logo" style={{ marginRight: "10px" }} />
                    <Typography color="#f4f5f5" sx={{ fontSize: "16px" }}>
                        SPARK AI
                    </Typography>
                </Box>
                <Box className={classes.navLinks} sx={{ pl: 5 }}>
                    <Typography color="#f4f5f5" sx={{ fontSize: "16px" }}>
                        My Project
                    </Typography>
                    <Typography sx={{ fontSize: "16px" }}>Trash</Typography>
                    <Typography sx={{ fontSize: "16px" }}>Analytics</Typography>
                </Box>
                <Box>
                    <Button
                        className={classes.createButton}
                        onClick={() => navigate("../Login")}
                        sx={{ border: 1, borderColor: "#746380", mr: 2 }}
                    >
                        Create File
                    </Button>
                    <IconButton>
                        <Avatar />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
