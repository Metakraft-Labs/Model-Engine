import React from "react";
import { useTranslation } from "react-i18next";

import { Button, CircularProgress, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { fileBrowserPath } from "../../../../../common/src/schema.type.module";
import { useHookstate } from "../../../../../hyperflux";
import { useMutation } from "../../../../../spatial/common/functions/FeathersHooks";
import Modal from "../../../../Modal";
import { PopoverState } from "../../../services/PopoverState";

export default function DeleteFileModal({ files, onComplete }) {
    const { t } = useTranslation();
    const modalProcessing = useHookstate(false);
    const fileService = useMutation(fileBrowserPath);

    const handleSubmit = async () => {
        modalProcessing.set(true);
        try {
            await Promise.all(files.map(file => fileService.remove(file.key)));
            modalProcessing.set(false);
            PopoverState.hidePopupover();
            onComplete?.();
        } catch (err) {
            toast.error(err.message);
            modalProcessing.set(false);
            onComplete?.(err);
        }
    };

    return (
        <Modal
            open={true}
            heading="Delete file?"
            sx={{
                width: "50vw",
            }}
            onClose={PopoverState.hidePopupover}
        >
            <Typography className="w-full text-center">
                {files.length === 1
                    ? `Do you want to delete ${files[0].fullName}?`
                    : `Do you want to delete ${files[0].fullName} amd ${files.length} others?`}
            </Typography>
            <Button
                color={"error"}
                disabled={submitLoading}
                endIcon={submitLoading ? <CircularProgress /> : <></>}
                onClick={handleSubmit}
            >
                Submit
            </Button>
        </Modal>
    );
}
