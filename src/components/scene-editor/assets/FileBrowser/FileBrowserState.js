import { defineState, syncStateWithLocalStorage } from "../../../../hyperflux";

export const FilesViewModeState = defineState({
    name: "FilesViewModeState",
    initial: {
        viewMode: "icons",
    },
    extension: syncStateWithLocalStorage(["viewMode"]),
});

export const availableTableColumns = ["name", "type", "dateModified", "size"];

export const FilesViewModeSettings = defineState({
    name: "FilesViewModeSettings",
    initial: {
        icons: {
            iconSize: 90,
        },
        list: {
            fontSize: 15,
            selectedTableColumns: {
                name: true,
                type: true,
                dateModified: true,
                size: true,
            },
        },
    },
    extension: syncStateWithLocalStorage(["icons", "list"]),
});
