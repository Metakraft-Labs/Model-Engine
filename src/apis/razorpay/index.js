import { auth } from "../";

export const orderTokens = async plan => {
    const res = await auth({ method: "POST", url: "/razorpay/order-tokens", data: { plan } });
    return res?.data;
};
