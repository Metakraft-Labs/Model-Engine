import React from "react";
import Modal from "../../Modal";
import { PopoverState } from "../services/PopoverState";

const ErrorDialog = ({ title, description, modalProps }) => {
    return (
        <Modal
            heading={title}
            subHeading={description}
            open={true}
            onClose={PopoverState.hidePopupover}
            {...modalProps}
        >
            <Button onClick={() => PopoverState.hidePopupover()}>Submit</Button>
        </Modal>
    );
};

export default ErrorDialog;
