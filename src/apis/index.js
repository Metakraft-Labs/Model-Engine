import axios from "axios";
import { toast } from "react-toastify";
export const noAuth = async ({ method, url, data = {}, options = {} }) => {
    try {
        const headers = options?.headers || {};
        delete options["headers"];
        const res = await axios({
            method,
            url: `${process.env.REACT_APP_API_URL}${url}`,
            data,
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            ...options,
        });

        if (!res?.data?.success) {
            throw new Error(res?.data?.message);
        }

        return res.data;
    } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Something went wrong!");
    }
};

export const auth = async ({ method, url, data = {}, options = {} }) => {
    try {
        const headers = options?.headers || {};
        delete options["headers"];
        const res = await axios({
            method,
            url: `${process.env.REACT_APP_API_URL}${url}`,
            data,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage?.getItem("token") || ""}`,
                ...headers,
            },
            ...options,
        });

        if (!res?.data?.success) {
            throw new Error(res?.data?.message);
        }

        return res.data;
    } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Something went wrong!");
    }
};
