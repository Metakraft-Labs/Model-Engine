import React from "react";

import { useHookstate } from "../../hyperflux";
import { PopoverState } from "../scene-editor/services/PopoverState";

// todo move this to core engine
const ClickawayListener = props => {
    const childOver = useHookstate(false);
    return (
        <div
            className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50"
            onMouseDown={() => {
                if (childOver.value) return;
                PopoverState.hidePopupover();
            }}
        >
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                onMouseEnter={() => childOver.set(true)}
                onMouseLeave={() => childOver.set(false)}
            >
                {props.children}
            </div>
        </div>
    );
};

ClickawayListener.displayName = "ClickawayListener";

ClickawayListener.defaultProps = {
    children: null,
};

export default ClickawayListener;
