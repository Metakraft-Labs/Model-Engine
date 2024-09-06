export const validatePath = url => {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    xhr.send();

    return xhr.status !== 404;
};
