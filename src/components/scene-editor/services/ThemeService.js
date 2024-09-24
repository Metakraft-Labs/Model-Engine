import {
    defineState,
    getMutableState,
    syncStateWithLocalStorage,
    useMutableState,
} from "../../../hyperflux";

import { useEffect } from "react";

const lightTheme = {
    "bg-primary": "#F5F5F5",
    "bg-secondary": "#FFFFFF",
    "bg-highlight": "#D9D9D9",
    "bg-surface-bg": "#FFFFFF",
    "bg-surface-main": "#FFFFFF",
    "bg-surface-dropdown": "#FFFFFF",
    "bg-surface-input": "#FFFFFF",
    "bg-surface-card": "#FFFFFF",
    "bg-table-secondary": "#F9FAFB",
    "bg-blue-secondary": "#D4DFF7",
    "bg-studio-surface": "#F5F5F5",
    "bg-banner-informative": "#FFFBEB",

    "bg-tag-green": "#10B981",
    "bg-tag-lime": "#9ACD32",
    "bg-tag-red": "#D1004B",
    "bg-tag-yellow": "#FEF3C7",

    "text-input": "#9CA0AA",
    "text-primary": "#262626",
    "text-secondary": "#6B7280",
    "text-highlight": "#000000",
    "text-gray3": "#D3D5D9",
    "text-menu-default": "#9CA0AA",

    "icon-green": "#0D9488 ",
    "icon-red": "#E11D48",

    "border-primary": "#E5E7EB",
    "border-input": "#42454D",
    "border-focus": "#375DAF",

    "blue-primary": "#375DAF",
    selection: "#3166D0",
};

const darkTheme = {
    "bg-primary": "#111113",
    "bg-secondary": "#000000",
    "bg-highlight": "#212226",
    "bg-surface-bg": "#080808",
    "bg-surface-main": "#1A1B1E",
    "bg-surface-dropdown": "#141619",
    "bg-surface-input": "#141619",
    "bg-surface-card": "#292a2c",
    "bg-table-secondary": "#212226",
    "bg-blue-secondary": "#2A3753",
    "bg-studio-surface": "#191B1F",
    "bg-banner-informative": "#D9770633",

    "bg-tag-green": "#064E3B",
    "bg-tag-lime": "#9ACD32",
    "bg-tag-red": "#B30911",
    "bg-tag-yellow": "#CA8A04",

    "text-input": "#9CA0AA",
    "text-primary": "#F5F5F5",
    "text-secondary": "#D4D4D4",
    "text-highlight": "#FFFFFF",
    "text-gray3": "#D3D5D9",
    "text-menu-default": "#9CA0AA",

    "icon-green": "#0D9488 ",
    "icon-red": "#FB7185",

    "border-primary": "#2B2C30",
    "border-input": "#42454D",
    "border-focus": "#375DAF",

    "blue-primary": "#375DAF",
    selection: "#1E4273",
};

export const themes = {
    light: lightTheme,
    dark: darkTheme,
    custom: {},
};

export const ThemeState = defineState({
    name: "ThemeState",
    initial: {
        theme: "dark",
    },

    setTheme: theme => {
        getMutableState(ThemeState).theme.set(theme);
    },

    extension: syncStateWithLocalStorage(["theme"]),
});

export const updateTheme = themeClasses => {
    if (themeClasses) {
        const root = document.querySelector(":root");
        for (const variable of Object.keys(themeClasses)) {
            root.style.setProperty("--" + variable, themeClasses[variable]);
        }
    }
};

export const useThemeProvider = () => {
    const themeState = useMutableState(ThemeState);
    const themeClasses = themes[themeState.theme.value];

    useEffect(() => {
        updateTheme(themeClasses);
    }, []);

    useEffect(() => {
        const html = document.querySelector("html");
        if (html) {
            html.setAttribute("data-theme", themeState.theme.value);
            updateTheme(themeClasses);
        }
    }, [themeState.theme]);
};
