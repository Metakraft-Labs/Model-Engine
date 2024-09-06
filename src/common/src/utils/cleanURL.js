export const cleanURL = url => {
    const newURL = new URL(url);
    return newURL.origin + newURL.pathname;
};
