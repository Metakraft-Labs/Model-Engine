import { auth } from "../";

export const generate = async ({ prompt, image, type, quality, file = null }) => {
    let res;
    if (file) {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("quality", quality);
        formData.append("type", type);
        res = await auth({
            method: "POST",
            url: "/3d-model-gen/generate",
            data: formData,
            options: {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        });
        return res?.data;
    }
    res = await auth({
        method: "POST",
        url: "/3d-model-gen/generate",
        data: { prompt, type, image, quality },
    });
    return res?.data;
};
