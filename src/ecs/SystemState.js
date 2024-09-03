import { defineState } from "../hyperflux";

export const SystemState = defineState({
    name: "ee.meta.SystemState",
    initial: () => ({
        performanceProfilingEnabled: process.env.NODE_ENV === "development",
        activeSystemReactors: new Map(),
        currentSystemUUID: "__null__",
        reactiveQueryStates: new Set(),
    }),
});
