import Component from "./index";

export default {
    title: "Components/Progress",
    component: Component,
    parameters: {
        componentSubtitle: "Progress",
    },
};

export const Default = {
    args: {
        className: "w-[50vw]",
        value: 10,
    },
};
