import { ReactorReconciler } from "./ReactorFunctions";

export class HyperFlux {
    static store;
}

export function createHyperStore(
    options = {
        publicPath,
        getDispatchTime: () => 0,
        defaultDispatchDelay: () => 0,
        getCurrentReactorRoot: () => undefined,
    },
) {
    const store = {
        publicPath: options.publicPath,
        defaultTopic: "default",
        forwardingTopics: new Set(),
        getDispatchTime: options.getDispatchTime ?? (() => 0),
        defaultDispatchDelay: options.defaultDispatchDelay ?? (() => 0),
        getCurrentReactorRoot: options.getCurrentReactorRoot ?? (() => undefined),
        userID: "",
        peerID: uuidv4(),
        stateMap: {},
        stateReactors: {},
        actions: {
            queues: new Map(),
            cached: [],
            incoming: [],
            history: [],
            knownUUIDs: new Set(),
            outgoing: {},
        },
        receptors: {},
        activeReactors: new Set(),
    };
    HyperFlux.store = store;
    return store;
}

export const disposeStore = (store = HyperFlux.store) => {
    for (const reactor of store.activeReactors) {
        ReactorReconciler.flushSync(() => reactor.stop());
    }
};
