import { Vector3 } from "three";

export const TransformPivot = {
    Selection: "Selection",
    Center: "Center",
    Bottom: "Bottom",
    Origin: "Origin",
};
export const TransformMode = {
    translate: "translate",
    rotate: "rotate",
    scale: "scale",
};

export const TransformAxis = {
    X: "X",
    Y: "Y",
    Z: "Z",
    XY: "XY",
    YZ: "YZ",
    XZ: "XZ",
    XYZ: "XYZ",
    XYZE: "XYZE",
    E: "E",
};
export const TransformAxisConstraints = {
    X: new Vector3(1, 0, 0),
    Y: new Vector3(0, 1, 0),
    Z: new Vector3(0, 0, 1),
    XY: new Vector3(1, 1, 0),
    YZ: new Vector3(0, 1, 1),
    XZ: new Vector3(1, 0, 1),
    XYZ: new Vector3(1, 1, 1),
};
export const TransformAxisAction = {
    Translate: "Translate",
    Rotate: "Rotate",
    Scale: "Scale",
};
export const SnapMode = {
    Disabled: "Disabled",
    Grid: "Grid",
};

export const TransformSpace = {
    world: "world",
    local: "local",
};
