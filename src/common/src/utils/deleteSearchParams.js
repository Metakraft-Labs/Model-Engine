export const deleteSearchParams = param => {
    const location = new URL(window.location);
    location.searchParams.delete(param);
    window.history.pushState({}, document.title, location.href);
};
