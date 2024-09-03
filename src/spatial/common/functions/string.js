export function insertBeforeString(source, searchTerm, addition) {
    const position = source.indexOf(searchTerm);
    return [source.slice(0, position), addition, source.slice(position)].join("\n");
}

/**
 * Inserts a string after the first occurrence of the search term
 * @param source
 * @param searchTerm
 * @param addition
 * @returns
 */
export function insertAfterString(source, searchTerm, addition) {
    const position = source.indexOf(searchTerm);
    return [
        source.slice(0, position + searchTerm.length),
        addition,
        source.slice(position + searchTerm.length),
    ].join("\n");
}
