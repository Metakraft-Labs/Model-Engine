import { auth } from "../";

export const orderTokens = async ({ plan, rpcUrl, transactionHash }) => {
    const res = await auth({
        method: "POST",
        url: "/contract-payments/order-tokens",
        data: { plan, rpcUrl, transactionHash },
    });
    return res?.data;
};
