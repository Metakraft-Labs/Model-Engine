import * as bitECS from "bitecs";
import React, { memo, Suspense, useLayoutEffect, useMemo } from "react";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { getState, HyperFlux, startReactor, useImmediateEffect } from "../hyperflux";
import { useOptionalComponent } from "./ComponentFunctions";
import { EntityContext } from "./EntityFunctions";
import { defineSystem } from "./SystemFunctions";
import { PresentationSystemGroup } from "./SystemGroups";
import { SystemState } from "./SystemState";

export function defineQuery(components) {
    const query = bitECS.defineQuery(components);
    const enterQuery = bitECS.enterQuery(query);
    const exitQuery = bitECS.exitQuery(query);

    const wrappedQuery = () => {
        return query(HyperFlux.store);
    };
    wrappedQuery.enter = () => {
        return enterQuery(HyperFlux.store);
    };
    wrappedQuery.exit = () => {
        return exitQuery(HyperFlux.store);
    };

    wrappedQuery._query = query;
    wrappedQuery._enterQuery = enterQuery;
    wrappedQuery._exitQuery = exitQuery;
    return wrappedQuery;
}

export function removeQuery(query) {
    bitECS.removeQuery(HyperFlux.store, query._query);
    bitECS.removeQuery(HyperFlux.store, query._enterQuery);
    bitECS.removeQuery(HyperFlux.store, query._exitQuery);
}

export const ReactiveQuerySystem = defineSystem({
    uuid: "ee.hyperflux.ReactiveQuerySystem",
    insert: { after: PresentationSystemGroup },
    execute: () => {
        for (const { query, forceUpdate } of getState(SystemState).reactiveQueryStates) {
            const entitiesAdded = query.enter().length;
            const entitiesRemoved = query.exit().length;
            if (entitiesAdded || entitiesRemoved) forceUpdate();
        }
    },
});

/**
 * Use a query in a reactive context (a React component)
 * - "components" argument must not change
 */
export function useQuery(components) {
    const query = defineQuery(components);
    const eids = query();
    removeQuery(query);

    const forceUpdate = useForceUpdate();

    // Use a layout effect to ensure that `queryResult`
    // is deleted from the `reactiveQueryStates` map immediately when the current
    // component is unmounted, before any other code attempts to set it
    // (component state can't be modified after a component is unmounted)
    useLayoutEffect(() => {
        const query = defineQuery(components);
        const queryState = { query, forceUpdate, components };
        getState(SystemState).reactiveQueryStates.add(queryState);
        return () => {
            removeQuery(query);
            getState(SystemState).reactiveQueryStates.delete(queryState);
        };
    }, []);

    // create an effect that forces an update when any components in the query change
    // use an immediate effect to ensure that the reactor is initialized even if this component becomes suspended during this render
    useImmediateEffect(() => {
        function UseQueryEntityReactor({ entity }) {
            return (
                <>
                    {components.map(C => {
                        const Component = "isComponent" in C ? C : C()[0];
                        return (
                            <UseQueryComponentReactor
                                entity={entity}
                                key={Component.name}
                                Component={Component}
                            ></UseQueryComponentReactor>
                        );
                    })}
                </>
            );
        }

        function UseQueryComponentReactor(props) {
            useOptionalComponent(props.entity, props.Component);
            forceUpdate();
            return null;
        }

        const root = startReactor(function UseQueryReactor() {
            return (
                <>
                    {eids.map(entity => (
                        <UseQueryEntityReactor key={entity} entity={entity}></UseQueryEntityReactor>
                    ))}
                </>
            );
        });

        return () => {
            root.stop();
        };
    }, [JSON.stringify(eids)]);

    return eids;
}

const QuerySubReactor = memo(props => {
    return (
        <>
            <QueryReactorErrorBoundary>
                <Suspense fallback={null}>
                    <EntityContext.Provider value={props.entity}>
                        <props.ChildEntityReactor {...props.props} />
                    </EntityContext.Provider>
                </Suspense>
            </QueryReactorErrorBoundary>
        </>
    );
});
QuerySubReactor.displayName = "QuerySubReactor";

export const QueryReactor = memo(props => {
    const entities = useQuery(props.Components);
    const MemoChildEntityReactor = useMemo(
        () => memo(props.ChildEntityReactor),
        [props.ChildEntityReactor],
    );
    return (
        <>
            {entities.map(entity => (
                <QuerySubReactor
                    key={entity}
                    entity={entity}
                    ChildEntityReactor={MemoChildEntityReactor}
                    props={props.props}
                />
            ))}
        </>
    );
});
QueryReactor.displayName = "QueryReactor";

class QueryReactorErrorBoundary extends React.Component {
    state = {
        error,
    };

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        return this.state.error ? null : this.props.children;
    }
}
