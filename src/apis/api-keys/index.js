import { auth } from "..";

export const create = async app_name => {
    const res = await auth({ method: "POST", url: "/api-keys", data: { app_name } });
    return res?.data;
};

export const list = async () => {
    const res = await auth({ method: "GET", url: "/api-keys" });
    return res?.data;
};

export const deleteKey = async id => {
    const res = await auth({ method: "DELETE", url: `/api-keys?api_key_id=${id}` });
    return res?.data;
};
