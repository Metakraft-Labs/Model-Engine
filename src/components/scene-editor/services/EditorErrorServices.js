import { defineState } from "../../../hyperflux";

export const EditorErrorState = defineState({
    name: "EditorErrorState",
    initial: { error: null },
});
