import { Delete } from "@mui/icons-material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import {
    Avatar,
    Box,
    Button,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deleteKey, list } from "../../../apis/api-keys";
import bg_grad from "../../../assets/img/account/bg_grad.png";
import faq from "../../../assets/img/account/faq.png";
import { UserStore } from "../../../contexts/UserStore";
import { CoinIcon } from "../../../icons/CoinIcon";
import Title from "../../../shared/Title";
import { copyToClipboard } from "../../../shared/strings";
import CreateAPIKeyModal from "./CreateAPIKeyModal";
import GetKraftModal from "./GetKraftModal";
import PaymentStatusModal from "./PaymentStatusModal";

export default function Account() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useSearchParams();
    const { user } = useContext(UserStore);
    const [showApiModal, setShowApiModal] = useState(false);
    const [showGetKraftModal, setShowGetKraftModal] = useState(false);
    const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
    const [apiKeys, setApiKeys] = useState([]);
    const [keyCopied, setKeyCopied] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("");
    const [paymentMessage, setPaymentMessage] = useState("");

    useEffect(() => {
        const payment_status = searchTerm.get("payment_status");
        const payment_message = searchTerm.get("payment_message");

        if (payment_status && payment_message) {
            setPaymentStatus(searchTerm.get("payment_status"));
            setPaymentMessage(searchTerm.get("payment_message"));
            setSearchTerm({});
            setShowPaymentStatusModal(true);
        }
    }, [searchTerm]);

    const getApiKeys = useCallback(async () => {
        const res = await list();

        setApiKeys(res || []);
    }, []);

    useEffect(() => {
        getApiKeys();
    }, [getApiKeys]);

    const copyKey = key => {
        copyToClipboard(`Bearer ${key}`);
        setKeyCopied(true);

        setTimeout(() => {
            setKeyCopied(false);
        }, 3000);
    };

    const deleteApp = async id => {
        await deleteKey(id);
        await getApiKeys();
    };

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
                                    width: "100%",
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
                                            type="button"
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
                                            onClick={() => setShowGetKraftModal(true)}
                                        >
                                            <Typography variant="body1" color="white">
                                                Add KRAFT
                                            </Typography>
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="h6" color="#D0D3D0" marginTop="40px">
                            API Keys
                        </Typography>
                        <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                            alignItems={"center"}
                        >
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
                                onClick={() =>
                                    window.open("https://docs.metakraft.ai/docs/spark-3d", "_blank")
                                }
                            >
                                <img src={faq} style={{ height: "18px", width: "18px" }} />
                                <Typography variant="caption" color="#BDC5C5">
                                    API Reference
                                </Typography>
                            </Button>
                            <Button
                                sx={{
                                    border: 1,
                                    mt: 2,
                                    gap: 1.2,
                                    px: 1,
                                    py: 1,
                                    backgroundColor: "#E18BFF",
                                    "&:hover": {
                                        backgroundColor: "#4E3562",
                                    },
                                    color: "#FFFFFF",
                                }}
                                onClick={() => setShowApiModal(true)}
                            >
                                <Typography variant="caption" color="#FFFFFF">
                                    Create an API Token
                                </Typography>
                            </Button>
                        </Box>
                        <Table
                            sx={{
                                backgroundColor: "#111111",
                                borderRadius: 2,
                                border: "1px solid #353535",
                                mt: 2,
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: "#FFFFFF" }}>Name</TableCell>
                                    <TableCell sx={{ color: "#FFFFFF" }}>Key</TableCell>
                                    <TableCell sx={{ color: "#FFFFFF" }}>Created At</TableCell>
                                    <TableCell sx={{ color: "#FFFFFF" }}></TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {apiKeys?.map((key, index) => (
                                    <TableRow key={index}>
                                        <TableCell sx={{ color: "#FFFFFF" }}>
                                            {key.app_name}
                                            {key.expired ? "[EXPIRED]" : ""}
                                        </TableCell>
                                        <TableCell sx={{ color: "#FFFFFF" }}>
                                            <Tooltip
                                                title={
                                                    keyCopied ? "Copied!" : "Click to copy the key"
                                                }
                                                placement={"top"}
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => copyKey(key.token)}
                                            >
                                                <span
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => copyKey(key.token)}
                                                >
                                                    ******
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ color: "#FFFFFF" }}>
                                            {moment(key.created_at).format("ll")}
                                        </TableCell>
                                        <TableCell sx={{ color: "#FFFFFF" }}>
                                            {key?.expired ? (
                                                ""
                                            ) : (
                                                <IconButton
                                                    sx={{ color: "red" }}
                                                    onClick={() => deleteApp(key.id)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                <CreateAPIKeyModal
                    showApiModal={showApiModal}
                    setShowApiModal={setShowApiModal}
                    getApiKeys={getApiKeys}
                />
                <GetKraftModal showModal={showGetKraftModal} setShowModal={setShowGetKraftModal} />
                <PaymentStatusModal
                    showModal={showPaymentStatusModal}
                    setShowModal={setShowPaymentStatusModal}
                    status={paymentStatus}
                    message={paymentMessage}
                />
            </Box>
        </>
    );
}
