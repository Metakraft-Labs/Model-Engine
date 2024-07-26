import { auth, noAuth } from "../";
import { convertToQueryParam } from "../../shared/objects";

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

export const getModel = async ({ id }) => {
    const res = await noAuth({
        method: "GET",
        url: `/3d-model-gen/${id}`,
    });
    return res?.data;
};

export const list = async ({ filters = {}, page = 1, limit = 10 }) => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen?page=${page}&limit=${limit}&${convertToQueryParam(filters, "filters")}`,
    });
    return { data: res?.data, pagination: res?.pagination };
};

export const refine = async id => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen/refine?id=${id}`,
    });
    return res?.data;
};

export const stylize = async (id, style) => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen/stylize?id=${id}&style=${style}`,
    });
    return res?.data;
};

export const preRig = async id => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen/pre-rig?id=${id}`,
    });
    return res?.data;
};

export const rig = async id => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen/rig?id=${id}`,
    });
    return res?.data;
};

export const animate = async (id, animation) => {
    const res = await auth({
        method: "GET",
        url: `/3d-model-gen/animate?id=${id}&animation=${animation}`,
    });
    return res?.data;
};
