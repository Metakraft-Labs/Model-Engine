import { List, Typography } from "@mui/material";
import React from "react";
import { Listitem } from "./styles";

export default function StyledList({ items }) {
    return (
        <List sx={{ width: "100%" }}>
            {items.map((item, index) => (
                <Listitem key={`styled-list-${index}`} selected={item.selected}>
                    {item.icon}{" "}
                    <Typography variant="p" fontSize={"16px"} fontWeight={500}>
                        {item.text}
                    </Typography>
                </Listitem>
            ))}
        </List>
    );
}
