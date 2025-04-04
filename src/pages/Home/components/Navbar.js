import {
    AppBar,
    Avatar,
    Box,
    Button,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Toolbar,
    Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AccountDropdown from "../../../components/AccountDropdown";
import { UserStore } from "../../../contexts/UserStore";
import useConnectWallet from "../../../hooks/useConnectWallet";
import { LogoIcon } from "../../../icons/LogoIcon";
import { getSupportedChains } from "../../../shared/web3utils";

const TABS = {
    "3d": "/text-2-3d",
    texture: "/text-2-texture",
};

export default function Navbar({ selectedTab }) {
    const classes = useStyles();
    const navigate = useNavigate();
    const {
        user,
        userWallet,
        chainId,
        setContract,
        setUserWallet,
        setToken,
        setBalance,
        setChainId,
        setSigner,
        setSkynetBrowserInstance,
    } = useContext(UserStore);
    const { connectWallet, RenderPrivyOtpModal, switchChain } = useConnectWallet({
        setContract,
        setUserWallet,
        user,
        setToken,
        setBalance,
        setChainId,
        setSigner,
        setSkynetBrowserInstance,
    });

    const [openAccountMenu, setOpenAccountMenu] = useState(null);

    const switchWallet = async chainId => {
        if (user.provider == "privy") {
            switchChain(chainId);
        }
        await connectWallet({
            emailAddress: user.email,
            chainId,
            forceLogin: true,
            switching: true,
        });
    };

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
                    <LogoIcon height="50" width="150" />
                </Box>
                <Box className={classes.navLinks} sx={{ pl: 5 }}>
                    <Typography color="#f4f5f5" sx={{ fontSize: "16px" }}>
                        <Link
                            style={{ textDecoration: "none", color: "white" }}
                            to="/user/projects"
                        >
                            My Projects
                        </Link>
                    </Typography>
                </Box>
                <Box>
                    {user?.provider !== "xion" && (
                        <FormControl sx={{ m: 1, minWidth: 120 }}>
                            <Select
                                value={chainId}
                                onChange={e => switchWallet(e.target.value)}
                                displayEmpty
                                inputProps={{ "aria-label": "Without label" }}
                                sx={{
                                    color: "#fff",
                                }}
                            >
                                {getSupportedChains().map(chain => (
                                    <MenuItem key={chain.id} value={chain.id}>
                                        {chain.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <Button
                        className={classes.createButton}
                        onClick={() => navigate(TABS[selectedTab] || "#")}
                        sx={{ border: 1, borderColor: "#746380", mr: 2 }}
                        disabled={!selectedTab}
                    >
                        Create File
                    </Button>
                    <IconButton
                        onClick={e =>
                            user && userWallet
                                ? setOpenAccountMenu(e.currentTarget)
                                : navigate("/login")
                        }
                    >
                        <Avatar />
                    </IconButton>
                    {user && userWallet && (
                        <AccountDropdown
                            open={openAccountMenu}
                            handleClose={() => setOpenAccountMenu(null)}
                            user={user}
                        />
                    )}
                </Box>
            </Toolbar>
            <RenderPrivyOtpModal />
        </AppBar>
    );
}

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
            backgroundColor: "#B054F8",
        },
    },
}));
