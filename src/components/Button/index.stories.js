import React from "react";
import { IoAddOutline, IoSend } from "react-icons/io5";

import Button from "./index";

const argTypes = {
    size: {
        control: "select",
        options: ["small", "medium", "large"],
    },
    variant: {
        control: "select",
        options: ["primary", "outline", "danger"],
    },
};

export default {
    title: "Components/Button",
    component: Button,
    parameters: {
        componentSubtitle: "Button",
    },
    argTypes,
};

export const Default = {
    args: {
        children: "Submit",
    },
};

export const WithStartIcon = {
    args: {
        children: "Submit",
        startIcon: <IoAddOutline />,
    },
};

export const WithEndIcon = {
    args: {
        children: "Send",
        endIcon: <IoSend />,
    },
};
