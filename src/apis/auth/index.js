import { auth, noAuth } from "..";

export const login = async data => {
    const res = await noAuth({ method: "POST", url: "/auth/login", data });
    return res?.data;
};

export const status = async () => {
    const res = await auth({ method: "GET", url: "/auth/status" });

    return res?.data;
};

export const getProviderByEmail = async email => {
    const res = await auth({ method: "GET", url: `/auth/get-provider-by-email?email=${email}` });

    return res?.data;
};

export const getReferrData = async id => {
    const res = await noAuth({ method: "GET", url: `/referal/user-data/${id}` });
    return res?.data;
};
