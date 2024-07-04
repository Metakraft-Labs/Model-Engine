import { auth } from "../";

export const generate = async prompt => {
    const res = await auth({ method: "POST", url: "/3d-model-gen/generate", data: { prompt } });
    return res?.data;
};

export const generateFromImage = async image => {
    const res = await auth({
        method: "POST",
        url: "/3d-model-gen/generate-from-image",
        data: { image },
    });
    return res?.data;
};

export const generateFromTripo = async prompt => {
    const res = await auth({
        method: "POST",
        url: "/3d-model-gen/generate-from-tripo",
        data: { prompt },
    });
    return res?.data;
};
