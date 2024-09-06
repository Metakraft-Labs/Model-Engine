/**
 * Create a function whose implementation can be easily updated or extended
 */
export const createHookableFunction = func => {
    const ctx = {
        args: [],
        result: undefined,
    };
    const wrapped = (...args) => {
        ctx.args = args;
        ctx.result = undefined;
        for (const h of wrapped.beforeHooks) h(ctx);
        ctx.result = wrapped.implementation(...ctx.args);
        for (const h of wrapped.afterHooks) h(ctx);
        return ctx.result;
    };
    wrapped.implementation = func;
    wrapped.beforeHooks = [];
    wrapped.afterHooks = [];
    wrapped.before = hook => {
        wrapped.beforeHooks.push(hook);
        return wrapped;
    };
    wrapped.after = hook => {
        wrapped.afterHooks.push(hook);
        return wrapped;
    };
    return wrapped;
};
