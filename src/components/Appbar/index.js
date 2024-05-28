import { Box, Toolbar, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import React, { Fragment, useContext } from "react";
import { GiStairs } from "react-icons/gi";
import { Link } from "react-router-dom";
import AppDataStore from "../../contexts/UserStore";
import LeftNav from "./LeftNav";

function HideOnScroll(props) {
    const { children, window } = props;
    const trigger = useScrollTrigger({
        target: window ? window() : undefined,
    });

    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {children}
        </Slide>
    );
}
export default function Appbar(props) {
    const { theme } = useContext(AppDataStore);

    return (
        <Fragment>
            <CssBaseline />
            <HideOnScroll {...props}>
                <AppBar
                    sx={{
                        backgroundColor: theme === "light" ? "#FFFFFF" : "#0A1929",
                        zIndex: theme => theme.zIndex.drawer + 1,
                        boxShadow: "none",
                        borderBottom: "1px solid #E5E8EB",
                    }}
                >
                    <Toolbar variant="regular">
                        <Link
                            to="/"
                            style={{
                                color: theme === "light" ? "#000000" : "#FFFFFF",
                                textDecoration: "none",
                                marginTop: "3px",
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={"20px"}>
                                <GiStairs />
                                <Typography variant="h6" sx={{ mr: 4, display: "flex" }}>
                                    {process.env.REACT_APP_NAME} Dashboard
                                </Typography>
                            </Box>
                        </Link>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <LeftNav />
        </Fragment>
    );
}
