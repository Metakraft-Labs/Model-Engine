import admin from "./i18n/en/admin.json";
import common from "./i18n/en/common.json";
import editor from "./i18n/en/editor.json";
import social from "./i18n/en/social.json";
import user from "./i18n/en/user.json";

export default function () {
    // @ts-ignore
    return {
        "./i18n/en/admin.json": { default: admin },
        "./i18n/en/common.json": { default: common },
        "./i18n/en/editor.json": { default: editor },
        "./i18n/en/social.json": { default: social },
        "./i18n/en/user.json": { default: user },
    };
}
