import React from "react";
import { Popup as ReactjsPopup } from "reactjs-popup";

export const Popup = ({ trigger, keepInside, ...props }) => {
    return (
        <ReactjsPopup
            closeOnDocumentClick
            closeOnEscape
            repositionOnResize
            on={"click"}
            keepTooltipInside={keepInside}
            arrow={false}
            trigger={<div style={{ all: "unset" }}>{trigger}</div>}
            contentStyle={{ overflow: "visible" }}
            {...props}
        />
    );
};
