import { makeInNOutFunctionDesc } from "../../../VisualScriptModule";

export const Constant = makeInNOutFunctionDesc({
    name: "math/boolean/constant",
    label: "Boolean",
    in: ["boolean"],
    out: "boolean",
    exec: a => a,
});

export const And = makeInNOutFunctionDesc({
    name: "math/boolean/and",
    label: "∧",
    in: ["boolean", "boolean"],
    out: "boolean",
    exec: (a, b) => a && b,
});

export const Or = makeInNOutFunctionDesc({
    name: "math/boolean/or",
    label: "∨",
    in: ["boolean", "boolean"],
    out: "boolean",
    exec: (a, b) => a || b,
});

export const Xor = makeInNOutFunctionDesc({
    name: "math/boolean/xor",
    label: "⊻",
    in: ["boolean", "boolean"],
    out: "boolean",
    exec: (a, b) => (a || b) && !(a && b),
});

export const Not = makeInNOutFunctionDesc({
    name: "math/boolean/negate",
    label: "¬",
    in: ["boolean"],
    out: "boolean",
    exec: a => !a,
});

export const ToFloat = makeInNOutFunctionDesc({
    name: "math/boolean/convert/toFloat",
    label: "To Float",
    in: ["boolean"],
    out: "float",
    exec: a => (a ? 1 : 0),
});

export const Equal = makeInNOutFunctionDesc({
    name: "math/boolean/compare/equal",
    label: "=",
    in: ["boolean", "boolean"],
    out: "boolean",
    exec: (a, b) => a === b,
});

export const toInteger = makeInNOutFunctionDesc({
    name: "math/boolean/convert/toInteger",
    label: "To Integer",
    in: ["boolean"],
    out: "integer",
    exec: a => (a ? 1n : 0n),
});
