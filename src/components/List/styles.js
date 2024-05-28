import styled from "@emotion/styled";
import { ListItemButton } from "@mui/material";

export const Listitem = styled(ListItemButton)`
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    font-size: 14px;

    &.Mui-focusVisible {
        border-radius: 25px;
        background-color: #f5f0e5;
    }

    &:hover {
        border-radius: 25px;
        background-color: #f5f0e5;
    }

    &.Mui-selected {
        border-radius: 25px;
        background-color: #f5f0e5;
    }
`;
