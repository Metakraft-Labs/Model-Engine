export function toCamelCase(text) {
    if (text.length > 0) {
        return text.slice(0, 1).toLocaleUpperCase() + text.slice(1);
    }
    return text;
}
