import { hookstate } from "@hookstate/core";
import React, { Suspense, useTransition } from "react";
import Reconciler from "react-reconciler";
import { ConcurrentRoot, DefaultEventPriority } from "react-reconciler/constants";
import { createErrorBoundary } from "../common/src/utils/createErrorBoundary";

import { HyperFlux } from "./StoreFunctions";

export const ReactorReconciler = Reconciler({
    warnsIfNotActing: true,
    getPublicInstance: instance => instance,
    getRootHostContext: () => null,
    getChildHostContext: parentHostContext => parentHostContext,
    prepareForCommit: () => null,
    resetAfterCommit: () => {},
    createInstance: () => {
        throw new Error("Only logical components are supported in a HyperFlux Reactor");
    },
    appendInitialChild: () => {},
    finalizeInitialChildren: () => {
        return false;
    },
    prepareUpdate: () => null,
    shouldSetTextContent: () => false,
    createTextInstance: () => {
        throw new Error("Only logical components are supported in a HyperFlux Reactor");
    },
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    isPrimaryRenderer: false,
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    preparePortalMount: () => {},
    getCurrentEventPriority: () => DefaultEventPriority,
    beforeActiveInstanceBlur: () => {},
    afterActiveInstanceBlur: () => {},
    detachDeletedInstance: () => {},
    getInstanceFromNode: () => null,
    getInstanceFromScope: () => null,
    prepareScopeUpdate: () => {},
    clearContainer: () => {},
});

ReactorReconciler.injectIntoDevTools({
    bundleType: process.env.NODE_ENV === "development" ? 1 : 0,
    rendererPackageName: "../../../hyperflux-reactor",
    version: "18.2.0",
});

const ReactorRootContext = React.createContext(undefined);

export function useReactorRootContext() {
    return React.useContext(ReactorRootContext);
}

export const ReactorErrorBoundary = createErrorBoundary(function error(props, error) {
    if (error) {
        console.error(error);
        props.reactorRoot.errors.merge([error]);
        return null;
    } else {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
});

export const ErrorBoundary = createErrorBoundary(function error(props, error) {
    if (error) {
        return null;
    } else {
        return <React.Fragment>{props.children}</React.Fragment>;
    }
});

export function startReactor(Reactor) {
    const isStrictMode = false;
    const concurrentUpdatesByDefaultOverride = true;
    const identifierPrefix = "";
    const onRecoverableError = err => {
        console.error(err, reactorRoot);
        reactorRoot.errors.merge([err]);
    };

    const fiberRoot = ReactorReconciler.createContainer(
        {},
        ConcurrentRoot,
        null,
        isStrictMode,
        concurrentUpdatesByDefaultOverride,
        identifierPrefix,
        onRecoverableError,
        null,
    );

    if (!Reactor.name) Object.defineProperty(Reactor, "name", { value: "HyperFluxReactor" });

    const ReactorContainer = () => {
        const [isPending] = useTransition();
        reactorRoot.suspended.set(isPending);
        return (
            <ReactorRootContext.Provider value={reactorRoot}>
                <Suspense fallback={<></>}>
                    <ReactorErrorBoundary key="reactor-error-boundary" reactorRoot={reactorRoot}>
                        <Reactor />
                    </ReactorErrorBoundary>
                </Suspense>
            </ReactorRootContext.Provider>
        );
    };

    const run = () => {
        reactorRoot.isRunning.set(true);
        HyperFlux.store.activeReactors.add(reactorRoot);
        ReactorReconciler.flushSync(() =>
            ReactorReconciler.updateContainer(<ReactorContainer />, fiberRoot),
        );
    };

    const stop = () => {
        if (!reactorRoot.isRunning.value) return Promise.resolve();
        ReactorReconciler.flushSync(() => ReactorReconciler.updateContainer(null, fiberRoot));
        reactorRoot.isRunning.set(false);
        HyperFlux.store.activeReactors.delete(reactorRoot);
        reactorRoot.cleanupFunctions.forEach(fn => fn());
        reactorRoot.cleanupFunctions.clear();
    };

    const reactorRoot = {
        fiber: fiberRoot,
        Reactor,
        isRunning: hookstate(false),
        errors: hookstate([]),
        suspended: hookstate(false),
        cleanupFunctions: new Set(),
        ReactorContainer: ReactorContainer,
        promise,
        run,
        stop,
    };

    reactorRoot.run();

    return reactorRoot;
}
