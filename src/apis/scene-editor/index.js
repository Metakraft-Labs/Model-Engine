import { auth } from "../";

export const save = async scene => {
    const res = await auth({
        method: "POST",
        url: "/scene-editor/save",
        data: { scene },
    });
    return res?.data;
};
