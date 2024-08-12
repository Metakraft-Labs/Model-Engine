import { Box, Button, Checkbox, Typography } from "@mui/material";
import React from "react";
import Modal from "../../../components/Modal";

export default function ChangeLicenseModal({
    open,
    onClose,
    license,
    setLicense,
    additionalInfo,
    setAdditionalInfo,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            heading={"Choose a Free License"}
            sx={{
                background: "#000000",
                border: "1px solid #A557CA",
                color: "#BABABA",
                alignItems: "start",
                justifyContent: "start",
                width: "30%",
                overflow: "auto",
                height: "80%",
            }}
        >
            <Typography fontWeight={700} textAlign={"start"}>
                Standard
            </Typography>
            <Box display={"flex"} gap={"10px"} alignItems={"start"}>
                <Checkbox
                    name={"free-checkbox"}
                    checked={license === "free"}
                    onChange={() => setLicense(l => (l === "free" ? "" : "free"))}
                    sx={{
                        color: "#BABABA",
                        "&.Mui-checked": {
                            color: "#A557CA",
                        },
                    }}
                />
                <Box display={"flex"} gap={"5px"} flexDirection={"column"} id={"free-checkbox"}>
                    <Typography fontWeight={700}>Free Standard</Typography>
                    <Typography fontWeight={400}>
                        Others can use your work worldwide, commercially or not, and in all types of
                        derivative work.
                    </Typography>
                </Box>
            </Box>
            <Typography fontWeight={700}>Creative Common</Typography>
            <Typography fontWeight={400}>
                Select what others can and cannot do with your Assets
            </Typography>
            <Box display={"flex"} gap={"10px"} alignItems={"start"}>
                <Checkbox
                    name={"attribution-checkbox"}
                    checked={license === "creative common" && additionalInfo?.attribution}
                    onChange={() => {
                        setLicense("creative common");
                        setAdditionalInfo(a => ({ ...a, attribution: !a.attribution }));
                    }}
                    sx={{
                        color: "#BABABA",
                        "&.Mui-checked": {
                            color: "#A557CA",
                        },
                    }}
                />
                <Box
                    display={"flex"}
                    gap={"5px"}
                    flexDirection={"column"}
                    id={"attribution-checkbox"}
                >
                    <Typography fontWeight={700}>Attribution</Typography>
                    <Typography fontWeight={400}>
                        Others can distribute, remix, tweak, and build upon your work as long as
                        they credit you for the original creation.
                    </Typography>
                </Box>
            </Box>
            <Box display={"flex"} gap={"10px"} alignItems={"start"}>
                <Checkbox
                    name={"nonCommercial-checkbox"}
                    checked={license === "creative common" && additionalInfo?.nonCommercial}
                    onChange={() => {
                        setLicense("creative common");
                        setAdditionalInfo(a => ({ ...a, nonCommercial: !a.nonCommercial }));
                    }}
                    sx={{
                        color: "#BABABA",
                        "&.Mui-checked": {
                            color: "#A557CA",
                        },
                    }}
                />
                <Box
                    display={"flex"}
                    gap={"5px"}
                    flexDirection={"column"}
                    id={"nonCommercial-checkbox"}
                >
                    <Typography fontWeight={700}>Non Commercial</Typography>
                    <Typography fontWeight={400}>
                        Others can not use your work commercially.
                    </Typography>
                </Box>
            </Box>
            <Box display={"flex"} gap={"10px"} alignItems={"start"}>
                <Checkbox
                    name={"nonDerivatives-checkbox"}
                    checked={license === "creative common" && additionalInfo?.nonDerivatives}
                    onChange={() => {
                        setLicense("creative common");
                        setAdditionalInfo(a => ({ ...a, nonDerivatives: !a.nonDerivatives }));
                    }}
                    sx={{
                        color: "#BABABA",
                        "&.Mui-checked": {
                            color: "#A557CA",
                        },
                    }}
                />
                <Box
                    display={"flex"}
                    gap={"5px"}
                    flexDirection={"column"}
                    id={"nonDerivatives-checkbox"}
                >
                    <Typography fontWeight={700}>No Derivatives</Typography>
                    <Typography fontWeight={400}>
                        Others can redistribute as long as it is passed along unchanged.
                    </Typography>
                </Box>
            </Box>
            <Box display={"flex"} gap={"10px"} alignItems={"start"}>
                <Checkbox
                    name={"shareAlike-checkbox"}
                    checked={license === "creative common" && additionalInfo?.shareAlike}
                    onChange={() => {
                        setLicense("creative common");
                        setAdditionalInfo(a => ({ ...a, shareAlike: !a.shareAlike }));
                    }}
                    sx={{
                        color: "#BABABA",
                        "&.Mui-checked": {
                            color: "#A557CA",
                        },
                    }}
                />
                <Box
                    display={"flex"}
                    gap={"5px"}
                    flexDirection={"column"}
                    id={"shareAlike-checkbox"}
                >
                    <Typography fontWeight={700}>Share Alike</Typography>
                    <Typography fontWeight={400}>
                        Others can remix, tweak, and build upon your work as long as they license
                        their new creations under identical terms
                    </Typography>
                </Box>
            </Box>
            <Button onClick={onClose} variant={"contained"} color={"secondary"}>
                Select
            </Button>
        </Modal>
    );
}
