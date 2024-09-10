import React from "react";
import Modal from "../../Modal";
import { PopoverState } from "../services/PopoverState";

const ErrorDialog = ({ title, description, modalProps, open }) => {
    return (
        <Modal
            heading={title}
            subHeading={description}
            open={open}
            onClose={PopoverState.hidePopupover}
            {...modalProps}
        >
            <Button onClick={() => PopoverState.hidePopupover()}>Submit</Button>
        </Modal>
    );
};

export default ErrorDialog;
