import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import {
    Avatar,
    Box,
    Button,
    Divider,
    IconButton,
    LinearProgress,
    Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import bar2 from "../../assets/img/account/bar2.png";
import bg_grad from "../../assets/img/account/bg_grad.png";
import faq from "../../assets/img/account/faq.png";
import red_cross from "../../assets/img/account/red_cross.png";
import UserStore from "../../contexts/UserStore";
import { CoinIcon } from "../../icons/CoinIcon";
import Title from "../../shared/Title";

const useStyles = makeStyles({
    root: {
        height: 10,
        borderRadius: 5,
    },
    bar: ({ progress }) => ({
        borderRadius: 5,
        background: `linear-gradient(90deg, #60a7fe ${100 - progress}%, #92fad1 100%)`,
    }),
});

export default function Account() {
    const navigate = useNavigate();
    const { user } = useContext(UserStore);

    const classes = useStyles({ progress: ((user?.tokens || 0) * 100) / 40 });

    return (
        <>
            <Title title={"Account Settings"} />
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    height: "100vh",
                    alignItems: "start",
                    justifyContent: "center",
                    background: "#000000",
                    backgroundImage: `url(${bg_grad})`,
                    backgroundPosition: "top left",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    pb: 5,
                }}
            >
                <Box
                    sx={{
                        width: "75%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "start",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "start",
                            width: "100%",
                            height: "8%",
                            p: 2,
                            m: 2,
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "left",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    border: 1,
                                    p: 1,
                                    borderColor: "#746380",
                                    borderRadius: 2,
                                }}
                            >
                                <IconButton
                                    onClick={() => navigate("/")}
                                    sx={{ height: "20px", width: "20px" }}
                                >
                                    <ArrowBackIosNewIcon
                                        sx={{
                                            fontSize: "medium",
                                            color: "white",
                                        }}
                                    />
                                </IconButton>
                            </Box>
                            <Avatar sx={{ width: 53, height: 53 }} />
                            <Typography variant="h6" color="#D8DCDA">
                                {user?.email}
                            </Typography>
                        </Box>
                        <Box>
                            <Button
                                sx={{
                                    border: 1,
                                    gap: 1.2,
                                    px: 3,
                                    py: 1,
                                    backgroundColor: "#181819",
                                    color: "white",
                                    borderRadius: 2,
                                    borderColor: "#414141",
                                    textTransform: "none",
                                    "&:hover": {
                                        backgroundColor: "#2B2B33",
                                    },
                                }}
                            >
                                <img src={faq} style={{ height: "18px", width: "18px" }} />
                                <Typography variant="caption" color="#BDC5C5">
                                    FAQ
                                </Typography>
                            </Button>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            width: "98%",
                            height: "100%",
                            justifyContent: "center",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "45%",
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "start",
                                    flexWrap: "wrap",
                                    width: "50%",
                                    height: "100%",
                                    backgroundColor: "#28212E",
                                    border: 1,
                                    borderRadius: 2,
                                    borderColor: "#9D50B0",
                                    gap: 1,
                                    mt: 1,
                                    pt: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "start",
                                        alignItems: "start",
                                        width: "93%",
                                    }}
                                >
                                    <Typography variant="h6" color="#C7CBCA">
                                        Current Plan
                                    </Typography>
                                </Box>
                                <Divider
                                    orientation="horizontal"
                                    sx={{
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background:
                                            "linear-gradient(to right, #7F8889, #C0C5C2, #7F8889)",
                                        height: "0.8px",
                                        width: "95%",
                                    }}
                                />
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        width: "90%",
                                        p: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "60%",
                                        }}
                                    >
                                        <Typography variant="body1" color="#AA63C3">
                                            Free
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "end",
                                                gap: 1,
                                                mt: 1,
                                            }}
                                        >
                                            <Typography variant="h3" color="#E2E5E4">
                                                $0
                                            </Typography>
                                            <Typography variant="caption" color="#7E8584">
                                                PerMonth
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 2,
                                                mt: 3,
                                            }}
                                        >
                                            <Typography variant="caption" color="#7E8584">
                                                Monthly Credits
                                            </Typography>
                                            <Typography variant="h6" color="#E2E5E4">
                                                40
                                            </Typography>
                                            <Typography variant="caption" color="#7E8584">
                                                APIAccess
                                            </Typography>
                                            <img
                                                src={red_cross}
                                                style={{ height: "18px", width: "18px" }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: "40%",
                                            display: "flex",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            sx={{
                                                border: 1,
                                                borderColor: "#746380",
                                                px: 3,
                                                py: 1,
                                                backgroundColor: "#923DC6",
                                                color: "white",
                                                borderRadius: 2,
                                                borderColor: "#622F7A",
                                                textTransform: "none",
                                                "&:hover": {
                                                    backgroundColor: "#4E3562",
                                                },
                                                height: "25%",
                                            }}
                                        >
                                            <Typography variant="caption" color="white">
                                                Upgrade Now
                                            </Typography>
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "start",
                                    flexWrap: "wrap",
                                    width: "50%",
                                    height: "100%",
                                    backgroundColor: "#111111",
                                    border: 5,
                                    borderRadius: 2,
                                    borderColor: "#2a2a2b",
                                    gap: 1,
                                    mt: 1,
                                    p: 0.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "95%",
                                        height: "20%",
                                        backgroundColor: "#111111",
                                        border: 1,
                                        borderRadius: 1,
                                        borderColor: "#252526",
                                        p: 1,
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                            gap: 1,
                                            mt: 1,
                                            pl: 1,
                                        }}
                                    >
                                        <CoinIcon height="21" width="19" />
                                        <Typography variant="h6" color="#C7CBCA">
                                            KRAFT
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Divider
                                            orientation="horizontal"
                                            sx={{
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#2D2D30",
                                                height: "0.8px",
                                                width: "100%",
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "row", width: "90%" }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            width: "60%",
                                            pb: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "end",
                                                gap: 1,
                                            }}
                                        >
                                            <Typography variant="h4" color="#E2E5E4">
                                                {user?.tokens}
                                            </Typography>
                                            <Typography variant="caption" color="#7E8584">
                                                Left
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "start",
                                                width: "100%",
                                                mt: 1,
                                            }}
                                        >
                                            <Typography variant="body2" color="#C0C5C2">
                                                Monthly Credits
                                            </Typography>
                                            <Typography variant="body2" color="#C0C5C2">
                                                {user?.tokens} of 40
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            sx={{ width: "100%" }}
                                            variant="determinate"
                                            classes={{ root: classes.root, bar: classes.bar }}
                                            value={((user?.tokens || 0) * 100) / 40}
                                        />
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                alignItems: "start",
                                                width: "100%",
                                                mt: 2,
                                            }}
                                        >
                                            <Typography variant="body2" color="#C0C5C2">
                                                Perrmanent Credits
                                            </Typography>
                                            <Typography variant="body2" color="#C0C5C2">
                                                0 of 0
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                width: "95%",
                                                justifyContent: "space-between",
                                                alignItems: "space-between",
                                                backgroundImage: `url(${bar2})`,
                                                backgroundPosition: "left",
                                                backgroundSize: "cover",
                                                backgroundRepeat: "no-repeat",
                                                p: 1,
                                            }}
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            width: "40%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-start",
                                            alignItems: "flex-end",
                                            gap: 2,
                                            pt: 1,
                                        }}
                                    >
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            sx={{
                                                border: 1,
                                                borderColor: "#746380",
                                                px: 1,
                                                py: 2,
                                                backgroundColor: "#923DC6",
                                                color: "white",
                                                borderRadius: 2,
                                                borderColor: "#622F7A",
                                                textTransform: "none",
                                                "&:hover": {
                                                    backgroundColor: "#4E3562",
                                                },
                                                height: "25%",
                                                width: "80%",
                                            }}
                                        >
                                            <Typography variant="body1" color="white">
                                                Add KRAFT
                                            </Typography>
                                        </Button>
                                        <Typography variant="body1" color="#D17337">
                                            Get Free KRAFT?
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="h6" color="#D0D3D0" marginTop="40px">
                            API Keys
                        </Typography>
                        <Typography variant="body2" color="#7E8584">
                            Upgrade your subscription plan to request APl access.
                        </Typography>
                        <Box>
                            <Button
                                sx={{
                                    border: 1,
                                    mt: 2,
                                    gap: 1.2,
                                    px: 1,
                                    py: 1,
                                    backgroundColor: "#181819",
                                    color: "white",
                                    borderRadius: 2,
                                    borderColor: "#414141",
                                    textTransform: "none",
                                    "&:hover": {
                                        backgroundColor: "#2B2B33",
                                    },
                                }}
                            >
                                <img src={faq} style={{ height: "18px", width: "18px" }} />
                                <Typography variant="caption" color="#BDC5C5">
                                    API Reference
                                </Typography>
                            </Button>
                        </Box>
                        <Box
                            sx={{
                                width: "98%",
                                height: "7%",
                                backgroundColor: "#111111",
                                borderRadius: 2,
                                border: "1px solid #353535",
                                mt: 2,
                                py: 1,
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "space-around",
                            }}
                        >
                            <Typography variant="body2" color="#7E8584">
                                Name
                            </Typography>
                            <Typography variant="body2" color="#7E8584">
                                Key
                            </Typography>
                            <Typography variant="body2" color="#7E8584">
                                Last Used
                            </Typography>
                            <Typography variant="body2" color="#7E8584">
                                Created
                            </Typography>
                        </Box>
                        {/* <Typography variant="h6" color="#D0D3D0" marginTop="30px">
                            Usage
                        </Typography>
                        <Typography variant="body2" color="#7E8584">
                            Your credits usage list including app and api.
                        </Typography>
                        <Box
                            sx={{
                                width: "94%",
                                height: "5%",
                                backgroundColor: "#111111",
                                borderTopRightRadius: "15px",
                                border: "1px solid #353535",
                                mt: 2,
                                pt: 1.5,
                                pl: 6,
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Date & Time
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Platform
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Type
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Amount
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Balance
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                width: "94%",
                                height: "5%",
                                backgroundColor: "#2D2D30",
                                border: "1px solid #353535",
                                pt: 1,
                                pl: 6,
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    6/1/2024,5:35:54AM
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    web
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    Monthly Credit - Free
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    40
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "20%",
                                    height: "100%",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="body2" color="#7E8584">
                                    40
                                </Typography>
                            </Box>
                        </Box> */}
                    </Box>
                </Box>
            </Box>
        </>
    );
}
