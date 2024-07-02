import { auth } from "../";

export const create = async prompt => {
    const res = await auth({ method: "POST", url: "/api-keys", data: { prompt } });
    return res?.data;
};

export const listItems = async () => {
    const res = await auth({ method: "GET", url: "/api-keys" });
    return res?.data;
};

export const deleteItem = async id => {
    const res = await auth({ method: "DELETE", url: "/api-keys?api_key_id=${id}" });
    return res?.data;
};
