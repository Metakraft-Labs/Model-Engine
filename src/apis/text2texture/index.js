import { auth } from "../";
import { convertToQueryParam } from "../../shared/objects";

export const generate = async prompt => {
    const res = await auth({ method: "POST", url: "/texture-gen/generate", data: { prompt } });
    return res?.data;
};

export const list = async ({ filters = {}, page = 1, limit = 10 }) => {
    const res = await auth({
        method: "GET",
        url: `/texture-gen?page=${page}&limit=${limit}&${convertToQueryParam(filters, "filters")}`,
    });
    return { data: res?.data, pagination: res?.pagination };
};
