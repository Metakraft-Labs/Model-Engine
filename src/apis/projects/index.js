import { auth } from "..";

export const listResources = async ({ filters = {}, page = 1, limit = 10 }) => {
    const res = await auth({
        method: "POST",
        url: `/projects/resources?page=${page}&limit=${limit}`,
        data: {
            filters,
        },
    });
    return { data: res?.data, pagination: res?.pagination };
};

export const updateResource = async (id, data = {}) => {
    const res = await auth({
        method: "PATCH",
        url: `/projects/resources/${id}`,
        data,
    });
    return res?.data;
};
