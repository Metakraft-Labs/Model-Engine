import { auth, noAuth } from "..";

export const login = async data => {
    const res = await noAuth({ method: "POST", url: "/auth/login", data });
    return res?.data;
};

export const register = async data => {
    const res = await noAuth({ method: "POST", url: "/auth/register", data });
    return res?.data;
};

export const status = async () => {
    const res = await auth({ method: "GET", url: "/auth/status" });

    return res?.data;
};
