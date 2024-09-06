export const getSearchParamFromURL = paramName => {
    const location = new URL(window.location);
    let params = new URLSearchParams(location.search);
    return params.get(paramName);
};
