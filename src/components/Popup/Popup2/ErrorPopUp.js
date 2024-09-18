import ErrorSharp from "@mui/icons-material/ErrorSharp";
import React from "react";

import PopUp from "./PopUp";

/**
 * ErrorPopup is used to render error message.
 *
 * @param {Object} props
 * @returns {JSX.Element}
 */
export function ErrorPopup(props) {
    if (!props) return null;
    return (
        <PopUp
            className="error-pop-up-container"
            iconClassName="error-pop-up-icon-box"
            icon={ErrorSharp}
            {...props}
        />
    );
}

export default ErrorPopup;
