import { auth } from "..";
import { convertToQueryParam } from "../../shared/objects";

export const listResources = async ({ filters = {}, page = 1, limit = 10 }) => {
    const res = await auth({
        method: "GET",
        url: `/projects/resources?page=${page}&limit=${limit}&${convertToQueryParam(filters, "filters")}`,
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
