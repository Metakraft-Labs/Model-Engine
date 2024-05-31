export const urlToFile = async (url, type = "images/png") => {
    // get file name from url
    const fileName = url.split("/").pop();

    // fetch file and convert to blob
    const response = await fetch(url);
    const blob = await response.blob();

    // get type of file
    type = response.headers.get("Content-Type") || blob.type || type;

    // create file from blob
    const file = new File([blob], fileName, { type });

    // Initiate file reader
    const reader = new FileReader();

    // Read file as data url
    reader.readAsDataURL(file);

    // Return promise
    return new Promise((resolve, reject) => {
        reader.onload = () => {
            const arrayBuffer = reader.result;
            const bytes = new Uint8Array(arrayBuffer);
            resolve({ arrayBuffer, bytes, file });
        };
        reader.onerror = reject;
    });
};
