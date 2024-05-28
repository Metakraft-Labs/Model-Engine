import { List, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Listitem } from "./styles";

export default function StyledList({ items }) {
    const navigate = useNavigate();

    return (
        <List sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item, index) => (
                <Listitem
                    key={`styled-list-${index}`}
                    selected={item.path === window.location.pathname}
                    onClick={() =>
                        item?.path ? navigate(item.path) : item?.onClick && item.onClick()
                    }
                >
                    {item.icon}{" "}
                    <Typography variant="p" fontSize={"16px"} fontWeight={500}>
                        {item.text}
                    </Typography>
                </Listitem>
            ))}
        </List>
    );
}
