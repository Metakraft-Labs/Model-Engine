import { auth } from "../";

export const getMessage = async ({ message, type = "typed_data" }) => {
    const res = await auth({
        method: "POST",
        url: "/greenfield/get-message",
        data: { message, type },
    });
    return res?.data;
};
