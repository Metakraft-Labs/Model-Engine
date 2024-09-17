import React from "react";

import { Button, CircularProgress, Typography } from "@mui/material";
import { useHookstate } from "../../hyperflux";
import Modal from "../Modal";
import { PopoverState } from "../scene-editor/services/PopoverState";

export const ConfirmDialog = ({ title, text, onSubmit, onClose, modalProps }) => {
    const errorText = useHookstate("");
    const modalProcessing = useHookstate(false);

    const handled = async () => {
        modalProcessing.set(true);
        try {
            await onSubmit();
            PopoverState.hidePopupover();
        } catch (error) {
            errorText.set(error.message);
        }
        modalProcessing.set(false);
    };

    return (
        <Modal
            heading={title || "Confirmation"}
            onClose={() => {
                PopoverState.hidePopupover();
                onClose?.();
            }}
            className="w-[50vw] max-w-2xl"
            submitLoading={modalProcessing.value}
            {...modalProps}
        >
            <div className="flex flex-col items-center gap-2">
                <Typography>{text}</Typography>
                {errorText.value && (
                    <Typography className="text-red-700	">{errorText.value}</Typography>
                )}
            </div>
            <Button
                color={"success"}
                onClick={handled}
                endIcon={modalProcessing.value ? <CircularProgress /> : <></>}
            >
                Submit
            </Button>
        </Modal>
    );
};

export default ConfirmDialog;
