import React, { useMemo } from "react";
import Checkbox from "../Checkbox";

export const BooleanInput = props => {
    const onBlur = () => {
        if (props.onRelease) props.onRelease(props.value);
    };
    const sx = useMemo(() => {
        return props.sx || {};
    }, [props]);

    return (
        <Checkbox
            sx={{
                borderRadius: "8px",
                border: "1px solid white",
                background: "#000000",
                cursor: disabled ? "default" : "pointer",
                "&:hover": {
                    border: "1px solid blue",
                },
                ...sx,
            }}
            onBlur={onBlur}
            {...props}
        />
    );
};

export default BooleanInput;
