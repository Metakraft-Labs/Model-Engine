import Component from "./index";

const argTypes = {};

export default {
    title: "Editor/Input/Array",
    component: Component,
    parameters: {
        componentSubtitle: "ArrayInput",
    },
    argTypes,
};

export const Default = {
    args: {
        label: "Source Path",
        containerClassName: "w-96",
        values: ["test name 1", "test value 2", "test 3", "test 4"],
        inputLabel: "Path",
    },
};
