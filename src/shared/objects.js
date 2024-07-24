export const convertToQueryParam = (object = {}, keyName = "data") => {
    let query = "";

    Object.keys(object).forEach(o => {
        if (typeof object[o] === "object" || Array.isArray(object[o])) {
            if (Array.isArray(object[o])) {
                query = `${query}${keyName}[]=${object[o]}&`;
            } else {
                query = `${query}${keyName}[${o}]=${object[o]}`;
            }
        } else {
            query = `${query}${keyName}[${o}]=${object[o]}&`;
        }
    });

    return query;
};
