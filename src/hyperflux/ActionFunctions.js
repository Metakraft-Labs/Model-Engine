import { matches, Parser, Validator } from "ts-matches";
import { v4 as uuidv4 } from "uuid";

import { createHookableFunction } from "../common/src/utils/createHookableFunction";
import { deepEqual } from "../common/src/utils/deepEqual";

import { setInitialState, StateDefinitions } from "./StateFunctions";
import { HyperFlux } from "./StoreFunctions";

const matchesPeerID = matches.string;

export { matches, Validator } from "ts-matches";
export { matchesPeerID };

/**
 * Defines an action
 * @param actionShape
 * @returns a function that creates an instance of the defined action
 */
export const ActionDefinitions = {};

export function isActionReceptor(f) {
    return "matchesAction" in f;
}

export function defineAction(shape) {
    const shapeEntries = Object.entries(shape);

    // handle default callback properties
    const defaultEntries = shapeEntries.filter(
        ([_k, v]) =>
            typeof v === "object" &&
            ("defaultValue" in v || ("parser" in v && v.parser.description.name === "Default")),
    );
    const defaultValidators = Object.fromEntries(
        defaultEntries.map(([k, v]) => [k, v instanceof Validator ? v : v.matches]),
    );

    // handle literal shape properties
    const literalEntries = shapeEntries.filter(([_k, v]) => typeof v !== "object");
    const literalValidators = Object.fromEntries(
        literalEntries.map(([k, v]) => [k, matches.literal(v)]),
    );

    // handle option properties
    const optionEntries = shapeEntries.filter(([k]) => k.startsWith("$"));
    const optionValidators = Object.fromEntries(
        optionEntries.map(([k, v]) => [k, matches.guard(val => deepEqual(val, v))]),
    );

    const type = shape.type;
    const primaryType = Array.isArray(type) ? type[0] : type;

    // create resolved action shape
    const resolvedActionShape = Object.assign(
        {},
        shape,
        optionValidators,
        literalValidators,
        defaultValidators,
        {
            type: matches.some(
                matches.literal(primaryType),
                matches.guard < string,
                any >
                    function (val) {
                        return Array.isArray(val) ? val.includes(primaryType) : val === primaryType;
                    },
            ),
        },
    );
    delete resolvedActionShape.$cache;
    delete resolvedActionShape.$topic;

    const allValuesNull = Object.fromEntries(
        Object.entries(resolvedActionShape).map(([k]) => [k, null]),
    );

    const matchesShape = matches.shape(resolvedActionShape);

    const actionCreator = partialAction => {
        const defaultValues = Object.fromEntries(
            defaultEntries.map(([k, v]) => [
                k,
                partialAction[k] ??
                    ("defaultValue" in v ? v.defaultValue() : v.parser["defaultValue"]),
            ]),
        );
        const action = {
            ...allValuesNull,
            ...Object.fromEntries([...optionEntries, ...literalEntries]),
            ...defaultValues,
            ...partialAction,
            type,
        };
        return matchesShape.unsafeCast(action);
    };

    actionCreator.actionShape = shape;
    actionCreator.resolvedActionShape = resolvedActionShape;
    actionCreator.type = shape.type;
    actionCreator.matches = matchesShape;
    actionCreator.extend = extendShape => {
        return {
            ...shape,
            ...extendShape,
            type: [extendShape.type, ...(Array.isArray(type) ? type : [type])],
        };
    };
    actionCreator.receive = actionReceptor => {
        const hookableReceptor = createHookableFunction(actionReceptor);
        hookableReceptor["matchesAction"] = matchesShape;
        return hookableReceptor;
    };

    ActionDefinitions[actionCreator.type] = actionCreator;
    return actionCreator;
}

/**
 * Dispatch actions to the store.
 * @param action
 * @param topics @todo potentially in the future, support dispatching to multiple topics
 * @param store
 */
export const dispatchAction = _action => {
    const action = JSON.parse(JSON.stringify(_action));

    const agentId = HyperFlux.store.peerID;

    action.$peer = action.$peer ?? agentId;
    action.$to = action.$to ?? "all";
    action.$time =
        action.$time ?? HyperFlux.store.getDispatchTime() + HyperFlux.store.defaultDispatchDelay();
    action.$cache = action.$cache ?? false;
    action.$uuid = action.$uuid ?? uuidv4();
    const topic = (action.$topic = action.$topic ?? HyperFlux.store.defaultTopic);

    if (process.env.APP_ENV === "development" && !action.$stack) {
        const trace = { stack: "" };
        Error.captureStackTrace?.(trace, dispatchAction); // In firefox captureStackTrace is undefined
        const stack = trace.stack.split("\n");
        stack.shift();
        action.$stack = stack;
    }

    HyperFlux.store.actions.incoming.push(action);

    addOutgoingTopicIfNecessary(topic);
};

export function addOutgoingTopicIfNecessary(topic) {
    if (!HyperFlux.store.actions.outgoing[topic]) {
        console.info(`Added topic ${topic}`);
        HyperFlux.store.actions.outgoing[topic] = {
            queue: [],
            history: [],
            forwardedUUIDs: new Set(),
        };
    }
}

const _updateCachedActions = incomingAction => {
    if (incomingAction.$cache) {
        const cachedActions = HyperFlux.store.actions.cached;
        // see if we must remove any previous actions
        if (typeof incomingAction.$cache === "boolean") {
            if (incomingAction.$cache) cachedActions.push(incomingAction);
        } else {
            const remove = incomingAction.$cache.removePrevious;

            if (remove) {
                for (const a of [...cachedActions]) {
                    if (a.$peer === incomingAction.$peer && a.type === incomingAction.type) {
                        if (remove === true) {
                            const idx = cachedActions.indexOf(a);
                            cachedActions.splice(idx, 1);
                        } else {
                            let matches = true;
                            for (const key of remove) {
                                if (!deepEqual(a[key], incomingAction[key])) {
                                    matches = false;
                                    break;
                                }
                            }
                            if (matches) {
                                const idx = cachedActions.indexOf(a);
                                cachedActions.splice(idx, 1);
                            }
                        }
                    }
                }
            }

            if (!incomingAction.$cache.disable) {
                cachedActions.push(incomingAction);
            }
        }
    }
};

const applyIncomingActionsToAllQueues = action => {
    for (const [queueHandle, queue] of HyperFlux.store.actions.queues) {
        if (queueHandle.test(action)) {
            // if the action is out of order, mark the queue as needing resync
            if (queue.actions.length > 0 && queue.actions.at(-1)?.$time > action.$time) {
                queue.needsResync = true;
            }
            queue.actions.push(action);
        }
    }
};

const createEventSourceQueues = action => {
    for (const definition of StateDefinitions.values()) {
        if (!definition.receptors || HyperFlux.store.receptors[definition.name]) continue;

        const matchedActions = Object.values(definition.receptors).map(r => r.matchesAction);
        if (!matchedActions.some(m => m.test(action))) continue;

        const receptorActionQueue = defineActionQueue(matchedActions);
        definition.receptorActionQueue = receptorActionQueue;

        // set resync to true to ensure the queue exists immediately
        receptorActionQueue.needsResync = true;

        if (!HyperFlux.store.stateMap[definition.name]) setInitialState(definition);

        const applyEventSourcing = () => {
            // queue may need to be reset when actions are recieved out of order
            // or when state needs to be rolled back
            if (receptorActionQueue.needsResync) {
                // reset the state to the initial value when the queue is reset
                setInitialState(definition);
                receptorActionQueue.resync();
            }

            let hasNewActions = false;

            // apply each action to each matching receptor, in order
            for (const action of receptorActionQueue()) {
                for (const definitionReceptor of Object.values(definition.receptors)) {
                    try {
                        const receptor = definitionReceptor;
                        if (receptor.matchesAction.test(action)) {
                            receptor(action);
                            hasNewActions = true;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            // if new actions were applied, synchronously run the reactor
            if (hasNewActions && HyperFlux.store.stateReactors[definition.name]) {
                HyperFlux.store.stateReactors[definition.name].run();
            }
        };

        HyperFlux.store.receptors[definition.name] = applyEventSourcing;
    }
};

const _applyIncomingAction = action => {
    // ensure actions are idempotent
    if (HyperFlux.store.actions.knownUUIDs.has(action.$uuid)) {
        //Certain actions were causing console.info to throw errors since it JSON.stringifies inputs, and those
        //actions had circular references. Just try/catching the console.info call was not catching them properly,
        //So the solution was to attempt to JSON.stringify them manually first to see if that would error.
        try {
            // const jsonStringified = JSON.stringify(action);
            // console.info('Repeat action %o', action)
        } catch (err) {
            console.log("error in logging action", action, err.message);
        }
        const idx = HyperFlux.store.actions.incoming.indexOf(action);
        HyperFlux.store.actions.incoming.splice(idx, 1);
        return;
    }

    _updateCachedActions(action);

    createEventSourceQueues(action);

    applyIncomingActionsToAllQueues(action);

    try {
        //Certain actions were causing console.info to throw errors since it JSON.stringifies inputs, and those
        //actions had circular references. Just try/catching the console.info call was not catching them properly,
        //So the solution was to attempt to JSON.stringify them manually first to see if that would error.
        try {
            console.info(`[Action]: ${action.type} %o`, action);
        } catch (err) {
            console.log("error in logging action", action, err.message);
        }
    } catch (e) {
        const message = e.message;
        const stack = e.stack?.split("\n");
        stack.shift();
        action.$ERROR = { message, stack };
        console.error(e);
    } finally {
        HyperFlux.store.actions.history.push(action);
        HyperFlux.store.actions.knownUUIDs.add(action.$uuid);
        const idx = HyperFlux.store.actions.incoming.indexOf(action);
        HyperFlux.store.actions.incoming.splice(idx, 1);
    }
};

const _forwardIfNecessary = action => {
    addOutgoingTopicIfNecessary(action.$topic);
    if (
        HyperFlux.store.peerID === action.$peer ||
        HyperFlux.store.forwardingTopics.has(action.$topic)
    ) {
        const outgoingActions = HyperFlux.store.actions.outgoing[action.$topic];
        if (outgoingActions.forwardedUUIDs.has(action.$uuid)) return;
        outgoingActions.queue.push(action);
        outgoingActions.forwardedUUIDs.add(action.$uuid);
    }
};

/** Drain event sourced queues and run receptors */
const applyEventSourcingToAllQueues = () => {
    for (const receptors of Object.values(HyperFlux.store.receptors)) receptors();
};

/**
 * Process incoming actions
 */
export const applyIncomingActions = () => {
    const { incoming } = HyperFlux.store.actions;
    const now = HyperFlux.store.getDispatchTime();
    for (const action of [...incoming]) {
        _forwardIfNecessary(action);
        if (action.$time <= now) _applyIncomingAction(action);
    }

    applyEventSourcingToAllQueues();
};

/**
 * Clear the outgoing action queue
 * @param store
 */
export const clearOutgoingActions = topic => {
    if (!HyperFlux.store.actions.outgoing[topic]) return;
    const { queue, history, forwardedUUIDs } = HyperFlux.store.actions.outgoing[topic];
    for (const action of queue) {
        history.push(action);
        forwardedUUIDs.add(action.$uuid);
    }
    queue.length = 0;
};

export function defineActionQueue(validator) {
    const shapes = Array.isArray(validator) ? validator : [validator];
    const shapeHash = shapes.map(Parser.parserAsString).join("|");

    const getOrCreateInstance = () => {
        const queueMap = HyperFlux.store.actions.queues;
        const reactorRoot = HyperFlux.store.getCurrentReactorRoot();
        let queueInstance = queueMap?.get(actionQueueGetter);

        if (!queueInstance) {
            queueInstance = {
                actions: [],
                nextIndex: 0,
                needsResync: false,
                reactorRoot,
            };
            queueMap.set(actionQueueGetter, queueInstance);
            reactorRoot?.cleanupFunctions.add(() => {
                removeActionQueue(actionQueueGetter);
            });
        }
        /** @todo sometimes there is no reactor root, which throws this unnecessarily */
        //  else if (queueInstance.reactorRoot !== reactorRoot) {
        //   throw new Error('Action queue is being used by multiple reactors')
        // }

        return queueInstance;
    };

    const actionQueueGetter = () => {
        const queueInstance = getOrCreateInstance();
        const result = queueInstance.actions.slice(queueInstance.nextIndex);
        queueInstance.nextIndex = queueInstance.actions.length;
        return result;
    };

    actionQueueGetter.test = a => {
        return shapes.some(s => s.test(a));
    };

    actionQueueGetter.shapeHash = shapeHash;

    actionQueueGetter.instance = null;
    Object.defineProperty(actionQueueGetter, "instance", {
        get: () => getOrCreateInstance(),
    });

    actionQueueGetter.needsResync = false;
    Object.defineProperty(actionQueueGetter, "needsResync", {
        get: () => getOrCreateInstance().needsResync,
        set: val => {
            getOrCreateInstance().needsResync = val;
        },
    });

    actionQueueGetter.resync = () => {
        // make sure actions are sorted by time, earliest first
        const queue = getOrCreateInstance();
        queue.actions = HyperFlux.store.actions.history
            .filter(actionQueueGetter.test)
            .sort((a, b) => a.$time - b.$time);
        queue.nextIndex = 0;
        actionQueueGetter.needsResync = false;
    };

    return actionQueueGetter;
}

/**
 * @deprecated use defineActionQueue instead
 */
export const createActionQueue = defineActionQueue;

export const removeActionQueue = queueHandle => {
    HyperFlux.store.actions.queues.delete(queueHandle);
};

export const matchesWithDefault = (matches, defaultValue) => {
    return { matches, defaultValue };
};
