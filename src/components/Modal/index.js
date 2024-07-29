import { CloseOutlined } from "@mui/icons-material";
import { Box, IconButton, Modal, Typography } from "@mui/material";
import React, { useContext } from "react";
import UserStore from "../../contexts/UserStore";

export default function StyledModal({ open, onClose, heading, subHeading, children, sx = {} }) {
    const { theme } = useContext(UserStore);

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sx,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "50%",
                    backgroundColor: theme === "light" ? "#FFFFFF" : "#0A1929",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "1rem",
                    borderRadius: "10px",
                    boxShadow: 24,
                    gap: "20px",
                }}
            >
                <Box
                    display={"flex"}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                    width={"100%"}
                    zIndex={99}
                >
                    <div></div>
                    <Typography variant="h4" color={"inherit"} sx={{ filter: "invert(100%)" }}>
                        {heading}
                    </Typography>
                    <IconButton onClick={onClose} color={"inherit"} sx={{ filter: "invert(100%)" }}>
                        <CloseOutlined />
                    </IconButton>
                </Box>
                {subHeading ? <Typography variant="h6">{subHeading}</Typography> : null}
                {children}
            </Box>
        </Modal>
    );
}
