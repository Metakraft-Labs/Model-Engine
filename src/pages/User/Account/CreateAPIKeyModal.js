import { Button, TextField } from "@mui/material";
import React, { useState } from "react";
import { create } from "../../../apis/api-keys";
import Modal from "../../../components/Modal";

export default function CreateAPIKeyModal({ showApiModal, setShowApiModal, getApiKeys }) {
    const [project, setProject] = useState("");
    const [loading, setLoading] = useState(false);

    const createToken = async e => {
        e.preventDefault();
        setLoading(true);

        const api = await create(project);

        if (api) {
            await getApiKeys();
        }
        setShowApiModal(false);
        setLoading(false);
    };

    return (
        <Modal
            heading={"Create an API token"}
            open={showApiModal}
            onClose={() => setShowApiModal(false)}
        >
            <TextField
                value={project}
                onChange={e => setProject(e.target.value)}
                fullWidth
                placeholder="Enter app name"
                sx={{
                    "& [placeholder]": {
                        color: "#FFFFFF",
                    },
                    color: "#FFFFFF",
                    border: "1px solid white",
                }}
            />

            <Button
                mt={2}
                color={"secondary"}
                variant={"contained"}
                onClick={createToken}
                disabled={loading || !project}
            >
                {loading ? "Creating..." : "Create"}
            </Button>
        </Modal>
    );
}
