import { auth } from "../";

export const generate = async prompt => {
    const res = await auth({
        method: "POST",
        url: "/text-2-image/generate",
        data: { text: prompt },
    });
    return res?.data;
};
