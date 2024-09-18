export const checkScope = async (_user, _currentType, _scopeToVerify) => {
    // const scopes = await API.instance.service(scopePath).find({
    //     query: {
    //         userId: user.id,
    //         paginate: false,
    //     },
    // });

    // if (!scopes || scopes.length === 0) {
    //     return false;
    // }

    // const currentScopes = scopes.reduce((result, sc) => {
    //     if (sc.type.split(":")[0] === currentType) result.push(sc.type.split(":")[1]);
    //     return result;
    // }, []);
    // if (!currentScopes.includes(scopeToVerify)) {
    //     return false;
    // }
    return true;
};
