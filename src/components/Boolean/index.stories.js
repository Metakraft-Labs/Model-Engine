import Component from "./index";

const argTypes = { value: false, onChange: () => {} };

export default {
    title: "Components/Boolean",
    component: Component,
    parameters: {
        componentSubtitle: "BooleanInput",
    },
    argTypes,
};
export const Default = {
    args: {
        value: false,
    },
};
