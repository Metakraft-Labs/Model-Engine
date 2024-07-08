import { auth } from "../";

export const generate = async ({ prompt, image, type, quality }) => {
    const res = await auth({
        method: "POST",
        url: "/3d-model-gen/generate",
        data: { prompt, type, image, quality },
    });
    return res?.data;
};
