/**
 * cleans a string to allow only alphanumeric, period, underscore, and dash
 * @param {string} str
 * @returns {string}
 */

export const cleanString = str => {
    return str.replaceAll(" ", "-").replace(/[^\w\.\-]/g, "");
};
