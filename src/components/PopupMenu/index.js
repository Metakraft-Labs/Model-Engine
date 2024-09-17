import React from "react";

import { getMutableState, NO_PROXY, useHookstate } from "../../hyperflux";
import { PopoverState } from "../scene-editor/services/PopoverState";

import ClickawayListener from "../ClickawayListener";

const PopupMenu = () => {
    const popoverElement = useHookstate(getMutableState(PopoverState).elements);
    return (
        <>
            {popoverElement.get(NO_PROXY).map((element, idx) => {
                return (
                    <div key={idx} className="block">
                        <ClickawayListener>{element ?? undefined}</ClickawayListener>
                    </div>
                );
            })}
        </>
    );
};
PopupMenu.displayName = "PopupMenu";

PopupMenu.defaultProps = {};

export default PopupMenu;
