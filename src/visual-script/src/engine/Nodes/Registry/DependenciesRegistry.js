export const registerDependency = (dependencies, key, dependency) => ({
    ...dependencies,
    [key]: dependency,
});
