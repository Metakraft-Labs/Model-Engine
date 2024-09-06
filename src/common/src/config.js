import { EMAIL_REGEX } from "./regex";

/**
 * Config settings (for client and isomorphic engine usage).
 */
const localBuildOrDev =
    process.env.NODE_ENV === "development" || process.env.VITE_LOCAL_BUILD === "true";

export function validateEmail(email) {
    return EMAIL_REGEX.test(email);
}

export function validatePhoneNumber(phone) {
    return /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone);
}

export const isDev = globalThis.process.env.APP_ENV === "development";
