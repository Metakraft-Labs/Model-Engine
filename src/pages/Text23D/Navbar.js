import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Divider,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext, useState } from "react";
import { BiShareAlt } from "react-icons/bi";
import { FaRegCircle } from "react-icons/fa";
import { GiWireframeGlobe } from "react-icons/gi";
import { MdOutlineSportsBasketball } from "react-icons/md";
import { RiDownloadCloudLine, RiGalleryFill } from "react-icons/ri";
import AccountDropdown from "../../components/AccountDropdown";
import UserStore from "../../contexts/UserStore";
import { CoinIcon } from "../../icons/CoinIcon";
import DownloadDropdown from "./components/DownloadDropdown";
import MintDropdown from "./components/MintDropdown";
import ShareDropdown from "./components/ShareDropdown";
import TokenDropdown from "./components/TokenDropdown";

const TABS = [
    {
        name: "textured",
        icon: <MdOutlineSportsBasketball />,
    },
    {
        name: "wireframe",
        icon: <GiWireframeGlobe />,
    },
    {
        name: "shaded",
        icon: <FaRegCircle />,
    },
];

export default function Navbar({
    selectedTab = "shaded",
    setSelectedTab,
    model,
    models,
    byteRes,
    prompt,
    imageUrl,
}) {
    const classes = useStyles();
    const { user } = useContext(UserStore);
    const [openDownloadMenu, setOpenDownloadMenu] = useState(null);
    const [openTokenMenu, setOpenTokenMenu] = useState(null);
    const [openAccountMenu, setOpenAccountMenu] = useState(null);
    const [openMintMenu, setOpenMintMenu] = useState(null);
    const [openShareMenu, setOpenShareMenu] = useState(null);

    return (
        <AppBar
            position="static"
            className={classes.appBar}
            sx={{
                border: "1px solid #37393c",
            }}
        >
            <Toolbar className={classes.toolbar}>
                <Box className={classes.navLinks}>
                    {TABS.map((t, i) => {
                        return (
                            <Tooltip
                                key={`display-tabs-${i}`}
                                placement="bottom"
                                title={t.name?.toUpperCase()}
                            >
                                <IconButton
                                    sx={{
                                        color: selectedTab === t.name ? "#000000" : "#FFFFFF",
                                        background:
                                            selectedTab === t.name ? "#FFFFFF" : "transparent",
                                        borderRadius: "4px",
                                        padding: "5px 1rem",
                                        "&:hover": {
                                            background:
                                                selectedTab === t.name ? "#FFFFFF" : "transparent",
                                            color: selectedTab === t.name ? "#000000" : "#FFFFFF",
                                        },
                                    }}
                                    onClick={() => setSelectedTab(t.name)}
                                >
                                    {t.icon}
                                </IconButton>
                            </Tooltip>
                        );
                    })}
                </Box>
                <Divider
                    orientation="vertical"
                    sx={{ borderColor: "#485357", height: "30px", borderWidth: "1px" }}
                />
                <Box display={"flex"} alignItems={"center"} gap={theme => theme.spacing(3)}>
                    <IconButton
                        sx={{
                            background: "transparent",
                            border: "none",
                            color: "#FFFFFF",
                            "&:hover": {
                                background: "transparent",
                                border: "none",
                                color: "#FFFFFF",
                            },
                        }}
                    >
                        <RiGalleryFill />
                    </IconButton>
                    <IconButton
                        sx={{
                            background: "transparent",
                            border: "none",
                            color: "#FFFFFF",
                            "&:hover": {
                                background: "transparent",
                                border: "none",
                                color: "#FFFFFF",
                            },
                            "&.Mui-disabled": {
                                background: "transparent",
                                border: "none",
                                color: "#FFFFFF",
                            },
                        }}
                        disabled={!models?.length}
                        onClick={e => setOpenDownloadMenu(e.currentTarget)}
                    >
                        <RiDownloadCloudLine />
                    </IconButton>
                    <DownloadDropdown
                        open={openDownloadMenu}
                        handleClose={() => setOpenDownloadMenu(null)}
                        models={models}
                    />
                </Box>
                <Divider
                    orientation="vertical"
                    sx={{ borderColor: "#485357", height: "30px", borderWidth: "1px" }}
                />
                <Box display={"flex"} gap={theme => theme.spacing(4)} alignItems={"center"}>
                    <IconButton
                        sx={{
                            background: "transparent",
                            border: "none",
                            color: "#FFFFFF",
                            padding: 0,
                            "&:hover": {
                                background: "transparent",
                                border: "none",
                                color: "#FFFFFF",
                                padding: 0,
                            },
                            "&.Mui-disabled": {
                                background: "transparent",
                                border: "none",
                                color: "#FFFFFF",
                                padding: 0,
                            },
                        }}
                        onClick={e => setOpenTokenMenu(e.currentTarget)}
                    >
                        <Badge
                            sx={{
                                border: "1px solid #727272",
                                padding: "6px 10px",
                                borderRadius: "20px",
                                alignItems: "center",
                                gap: "8px",
                                overflow: "hidden",
                            }}
                        >
                            <CoinIcon />
                            <Typography color={"#C2C2C2"} width={"27px"} fontWeight={400}>
                                {user?.tokens}
                            </Typography>
                        </Badge>
                    </IconButton>
                    <TokenDropdown
                        open={openTokenMenu}
                        handleClose={() => setOpenTokenMenu(null)}
                        user={user}
                    />
                    <IconButton onClick={e => setOpenAccountMenu(e.currentTarget)}>
                        <Avatar />
                    </IconButton>
                    <AccountDropdown
                        open={openAccountMenu}
                        handleClose={() => setOpenAccountMenu(null)}
                        user={user}
                    />
                    <IconButton
                        sx={{
                            color: "#FFFFFF",
                            background: "#4454e4",
                            borderRadius: "10px",
                            "&:hover": {
                                background: "#4454c2",
                            },
                            "&.Mui-disabled": {
                                background: "#4454c2",
                                color: "#FFFFFF",
                            },
                        }}
                        disabled={!imageUrl}
                        onClick={e => setOpenShareMenu(e.currentTarget)}
                    >
                        <BiShareAlt />
                    </IconButton>
                    <ShareDropdown
                        open={openShareMenu}
                        handleClose={() => setOpenShareMenu(null)}
                        imageUrl={imageUrl}
                        model={model}
                    />
                    <Button
                        className={classes.createButton}
                        onClick={e => setOpenMintMenu(e.currentTarget)}
                        sx={{ border: 1, borderColor: "#746380", mr: 2 }}
                        disabled={!model}
                    >
                        Launch
                    </Button>
                    <MintDropdown
                        open={openMintMenu}
                        handleClose={() => setOpenMintMenu(null)}
                        byteRes={byteRes}
                        url={model}
                        prompt={prompt}
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
}

const useStyles = makeStyles(theme => ({
    appBar: {
        backgroundColor: "#000000",
        borderRadius: 10,
        width: "60%",
        height: "100%",
        color: "#FFFFFF",
    },
    toolbar: {
        display: "flex",
        flexDirection: "row",
        height: "100%",
        gap: "1.6rem",
        flexWrap: "wrap",
        alignItems: "center",
    },
    navLinks: {
        display: "flex",
        gap: theme.spacing(3),
        background: "#D9D9D912",
        border: "0.1px solid #878787",
        borderRadius: "10px",
        padding: "4px 8px",
    },
    createButton: {
        backgroundColor: "#B054F8",
        color: "white",
        borderRadius: "12px",
        boxShadow: " 0px 0px 0px 3px rgba(81, 19, 103, 1)",
        padding: theme.spacing(1.5, 3),
        textTransform: "none",
        "&:hover": {
            backgroundColor: "#B054F8",
        },
    },
}));
