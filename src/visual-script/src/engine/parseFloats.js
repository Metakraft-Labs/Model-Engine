const cSeparator = /[^\d+.-]+/;

export function parseSafeFloat(text, fallback = 0) {
    try {
        return Number.parseFloat(text);
    } catch {
        return fallback;
    }
}
export function parseSafeFloats(text, fallback = 0) {
    return text
        .split(cSeparator)
        .filter(Boolean)
        .map(value => parseSafeFloat(value, fallback));
}

export function toSafeString(elements) {
    return `[${elements.join(",")}]`;
}
