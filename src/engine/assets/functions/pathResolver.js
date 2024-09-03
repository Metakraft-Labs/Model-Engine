import { STATIC_ASSET_REGEX } from "../../../common/src/regex";

export function getBasePath(path) {
    const regex = new RegExp(`(.*/(?:projects|static-resources)/[^/]*)`);
    return regex.exec(path)[0];
}

export function getFileName(path) {
    return /[^\\/]+$/.exec(path)?.[0] ?? "";
}

export function getRelativeURI(path) {
    return STATIC_ASSET_REGEX.exec(path)?.[3] ?? "";
}

export function getProjectName(path) {
    const match = STATIC_ASSET_REGEX.exec(path);
    if (!match?.length) return "";
    const [, orgName, projectName] = match;
    return `${orgName}/${projectName}`;
}

export function modelResourcesPath(modelName) {
    return `model-resources/${modelName.split(".").at(-2)}`;
}
