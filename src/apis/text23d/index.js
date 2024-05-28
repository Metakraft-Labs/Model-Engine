import { auth } from "../";

export const generate = async prompt => {
    const res = await auth({ method: "POST", url: "/3d-model-gen/generate", data: { prompt } });
    return res?.data;
};
