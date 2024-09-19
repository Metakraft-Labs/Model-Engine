import { defineState } from "../../../hyperflux";

export const MaterialSelectionState = defineState({
    name: "MaterialSelectionState",
    initial: {
        selectedMaterial: null,
    },
});
