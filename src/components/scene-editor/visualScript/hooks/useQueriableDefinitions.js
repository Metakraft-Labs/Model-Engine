export const toQueryableDefinitions = definitionsMap => ({
    get: id => definitionsMap[id],
    getAll: () => Object.values(definitionsMap),
    getAllNames: () => Object.keys(definitionsMap),
    contains: id => definitionsMap[id] !== undefined,
});

export const useQueryableDefinitions = definitionsMap => {
    const queriableDefinitions = useMemo(
        () => toQueryableDefinitions(definitionsMap),
        [definitionsMap],
    );

    return queriableDefinitions;
};
