import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";

import { API } from "../../../common";
import { defineState, getState, NO_PROXY, useHookstate, useMutableState } from "../../../hyperflux";

export const FeathersState = defineState({
    name: "ee.engine.FeathersState",
    initial: () => ({}),

    reactor: () => {
        const feathersState = useMutableState(FeathersState);
        return (
            <>
                {feathersState.keys.map(serviceName => (
                    <FeathersChildReactor key={serviceName} serviceName={serviceName} />
                ))}
            </>
        );
    },
});

const FeathersChildReactor = props => {
    const fetch = () => {
        const feathersState = getState(FeathersState);
        for (const queryId in feathersState[props.serviceName]) {
            feathersState[props.serviceName][queryId].fetch();
        }
    };

    useRealtime(props.serviceName, fetch);

    return null;
};

export const useService = (serviceName, method, ...args) => {
    const service = API.instance.service(serviceName);
    const state = useMutableState(FeathersState);

    const queryParams = {
        serviceName,
        method,
        args,
    };

    const queryId = `${method.substring(0, 1)}:${hashObject(queryParams)}`;

    const fetch = () => {
        if (method === "get" && !args) {
            state[serviceName][queryId].merge({
                status: "error",
                error: "Get method requires an id or query object",
            });
            return;
        }
        state[serviceName][queryId].merge({
            status: "pending",
            error: "",
        });
        return service[method](...args)
            .then(res => {
                state[serviceName][queryId].merge({
                    response: res,
                    status: "success",
                    error: "",
                });
            })
            .catch(error => {
                console.error(
                    `Error in service: ${serviceName}, method: ${method}, args: ${JSON.stringify(args)}`,
                    error,
                );
                state[serviceName][queryId].merge({
                    status: "error",
                    error: error.message,
                });
            });
    };

    useLayoutEffect(() => {
        if (!state.get(NO_PROXY)[serviceName]) state[serviceName].set({});
        if (!state.get(NO_PROXY)[serviceName][queryId]) {
            state[serviceName].merge({
                [queryId]: {
                    fetch,
                    query: queryParams,
                    response,
                    status: "pending",
                    error: "",
                },
            });
            fetch();
        }
    }, [serviceName, method, ...args]);

    const query = state[serviceName]?.[queryId];
    const queryObj = state.get(NO_PROXY)[serviceName]?.[queryId];
    const data = queryObj?.response;
    const error = queryObj?.error;
    const status = queryObj?.status;

    return useMemo(
        () => ({
            data,
            status,
            error,
            refetch: fetch,
        }),
        [data, query?.response, query?.status, query?.error],
    );
};

export const useGet = (serviceName, id, params = {}) => {
    return useService(serviceName, "get", id, params);
};

export const useFind = (serviceName, params = {}) => {
    const paginate = usePaginate(params.query);

    let requestParams;
    if (params.query?.paginate === false || params.query?.$paginate === false) {
        requestParams = {
            ...params,
            query: {
                ...params.query,
            },
        };
    } else {
        requestParams = {
            ...params,
            query: {
                ...params.query,
                ...paginate.query,
            },
        };
    }

    const response = useService(serviceName, "find", requestParams);

    const data = response?.data
        ? Array.isArray(response.data)
            ? response.data
            : response.data.data
              ? response.data.data
              : response.data
        : [];
    const total = response?.data && !Array.isArray(response.data) ? response.data.total : 0;

    return {
        ...response,
        total,
        setSort: paginate.setSort,
        setLimit: paginate.setLimit,
        setPage: paginate.setPage,
        search: paginate.search,
        page: paginate.page,
        skip: paginate.query.$skip,
        limit: paginate.query.$limit,
        sort: paginate.query.$sort,
        data: data,
    };
};

const forceRefetch = serviceName => {
    const feathersState = getState(FeathersState);
    if (!feathersState[serviceName]) return;
    for (const queryId in feathersState[serviceName]) {
        feathersState[serviceName][queryId].fetch();
    }
};

const created = ({ serviceName }) => {
    forceRefetch(serviceName);
};

const updated = ({ serviceName }) => {
    forceRefetch(serviceName);
};

const removed = ({ serviceName }) => {
    forceRefetch(serviceName);
};

/**
 * Simple mutation hook exposing crud methods
 * of any feathers service. The resulting state
 * of calling these operations needs to be handled
 * by the caller. as you create/update/patch/remove
 * entities using this helper, the entities cache gets updated
 */
export function useMutation(serviceName, forceRefetch = true) {
    const state = useHookstate({
        status: "idle",
        data,
        error,
    });

    const create = useMethod("create", forceRefetch ? created : undefined, serviceName, state);
    const update = useMethod("update", forceRefetch ? updated : undefined, serviceName, state);
    const patch = useMethod("patch", forceRefetch ? updated : undefined, serviceName, state);
    const remove = useMethod("remove", forceRefetch ? removed : undefined, serviceName, state);

    return useMemo(
        () => ({
            create,
            update,
            patch,
            remove,
            data: state.data.value,
            status: state.status.value,
            error: state.value.error,
        }),
        [create, update, patch, remove, state],
    );
}

function useMethod(method, action, serviceName, state) {
    return useCallback(
        (...args) => {
            const service = API.instance.service(serviceName);
            state.merge({ status: "loading", loading: true, data, error });
            return service[method](...args)
                .then(item => {
                    action && action({ serviceName, item });
                    state.merge({ status: "success", loading: false, data: item });
                    return item;
                })
                .catch(err => {
                    state.merge({ status: "error", loading: false, error: err });
                    throw err;
                });
        },
        [serviceName, method, action],
    );
}

export function hashObject(obj) {
    let hash = 0;
    const str = JSON.stringify(obj);

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return hash;
}

/**
 * An internal hook that will listen to realtime updates to a service
 * and update the cache as changes happen.
 */
export function useRealtime(serviceName, refetch) {
    useLayoutEffect(() => {
        const service = API.instance.service(serviceName);

        const handleCreated = data => refetch(data, "created");
        const handleUpdated = data => refetch(data, "updated");
        const handlePatched = data => refetch(data, "patched");
        const handleRemoved = data => refetch(data, "removed");

        service.on("created", handleCreated);
        service.on("updated", handleUpdated);
        service.on("patched", handlePatched);
        service.on("removed", handleRemoved);

        return () => {
            service.off("created", handleCreated);
            service.off("updated", handleUpdated);
            service.off("patched", handlePatched);
            service.off("removed", handleRemoved);
        };
    }, [serviceName]);
}

function resetPaginationProps(defaultProps) {
    return {
        $skip: defaultProps.$skip ?? 0,
        $limit: defaultProps.$limit ?? 10,
        $sort: defaultProps.$sort ?? {},
    };
}

export function usePaginate(defaultProps = {}) {
    const store = useHookstate(resetPaginationProps(defaultProps));

    const query = store.get(NO_PROXY);
    const storedPagination = useHookstate({ stored: false, query });

    const setSort = sort => {
        store.$sort.set(sort);
    };

    const setLimit = limit => {
        store.$limit.set(limit);
    };

    const setPage = page => {
        store.$skip.set(page * store.$limit.value);
    };

    const reset = () => {
        store.set(resetPaginationProps(defaultProps));
    };

    const _storePagination = () => {
        if (storedPagination.stored.value) return;
        storedPagination.set({ stored: true, query: structuredClone(query) });
        reset();
    };

    const _restorePagination = () => {
        if (!storedPagination.stored.value) return;
        store.set(structuredClone(storedPagination.get(NO_PROXY).query));
        storedPagination.merge({ stored: false });
    };

    const search = searchQuery => {
        if (searchQuery) {
            _storePagination();
            store.merge(searchQuery);
        } else {
            _restorePagination();
        }
    };

    return {
        query,
        page: Math.floor(store.$skip.value / store.$limit.value),
        setSort,
        setLimit,
        setPage,
        search,
    };
}

/**
 * Mutates the query object to store the pagination props, and add the search query
 */
export const useSearch = (query, searchQuery, active) => {
    useEffect(() => {
        if (active) {
            query.search(searchQuery);
        } else {
            query.search();
        }
    }, [active]);
};
