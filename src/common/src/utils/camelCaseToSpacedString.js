export const camelCaseToSpacedString = str => {
    return str.replace(/([a-z])([A-Z])/g, "$1 $2");
};
