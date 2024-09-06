export const sceneRelativePathIdentifier = "__$project$__";
export const sceneCorsPathIdentifier = "__$cors-proxy$__";
const storageProviderHost = `${process.env.REACT_APP_S3_ASSETS}/editor` ?? `https://localhost:8642`;

export const parseStorageProviderURLs = data => {
    for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === "object") {
            data[key] = parseStorageProviderURLs(val);
        }
        if (typeof val === "string") {
            if (val.includes(sceneRelativePathIdentifier)) {
                data[key] =
                    `${storageProviderHost}/projects` +
                    data[key].replace(sceneRelativePathIdentifier, "");
            }
        }
    }
    return data;
};

export const cleanStorageProviderURLs = data => {
    for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === "object") {
            data[key] = cleanStorageProviderURLs(val);
        }
        if (typeof val === "string") {
            if (val.includes(storageProviderHost + "/projects")) {
                data[key] = val.replace(
                    storageProviderHost + "/projects",
                    sceneRelativePathIdentifier,
                );
            }
        }
    }
    return data;
};
