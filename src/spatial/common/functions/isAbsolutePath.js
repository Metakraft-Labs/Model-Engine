import { ABSOLUTE_URL_PROTOCOL_REGEX } from "../../../shared/regex";

export const isAbsolutePath = path => {
    return ABSOLUTE_URL_PROTOCOL_REGEX.test(path);
};
