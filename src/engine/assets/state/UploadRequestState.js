import { defineState } from "../../../hyperflux";

export const UploadRequestState = defineState({
    name: "UploadRequestState",
    initial: {
        queue: [],
    },
});

export function executionPromiseKey(request) {
    return `${request.projectName}-${request.file.name}`;
}
