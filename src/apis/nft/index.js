import { auth } from "../";

export const mint = async ({ prompt, url, transactionHash, chainId, type }) => {
    const res = await auth({
        method: "POST",
        url: "/mint-nft",
        data: { prompt, url, transactionHash, chainId, type },
    });
    return res?.data;
};

export const list = async ({ type, page = 1, limit = 10 }) => {
    const res = await auth({
        method: "GET",
        url: `/mint-Nft?type=${type}&page=${page}&limit=${limit}`,
    });
    return { data: res?.data, pagination: res?.pagination };
};
