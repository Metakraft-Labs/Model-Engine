/**
 * Get directory from url: https://stackoverflow.com/a/42362796
 * @param url
 * @returns
 */
export const getDirectoryFromUrl = url => {
    const directory = url.replace(/[^/]*$/, "");

    return directory;
};
