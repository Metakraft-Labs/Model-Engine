import { auth } from "../";

export const getAcceptedCoins = async () => {
    const res = await auth({ method: "GET", url: "/coinpayments/coins" });
    return res?.data;
};

export const orderTokens = async (plan, coin) => {
    const res = await auth({
        method: "POST",
        url: "/coinpayments/order-tokens",
        data: { plan, coin },
    });
    return res?.data;
};
