import { entityExists } from "../../../ecs/EntityFunctions";
import { insertionSort } from "../../../shared/sort";
import {
    DistanceFromCameraComponent,
    FrustumCullCameraComponent,
} from "../../transform/components/DistanceComponents";

export const createPriorityQueue = args => {
    const accumulatingPriorities = new Map();

    const priorityEntities = new Set();

    let totalAccumulation = 0;

    const queue = {
        accumulatingPriorities: accumulatingPriorities,
        removeEntity: entity => {
            accumulatingPriorities.delete(entity);
        },
        addPriority: (entity, priority) => {
            if (!accumulatingPriorities.has(entity))
                accumulatingPriorities.set(entity, {
                    normalizedPriority: 0,
                    accumulatedPriority: 0,
                });
            const item = accumulatingPriorities?.get(entity);
            item.accumulatedPriority += priority;
            totalAccumulation += priority;
        },
        update: () => {
            priorityEntities.clear();
            for (const [entity, item] of accumulatingPriorities) {
                item.normalizedPriority +=
                    (item.accumulatedPriority * queue.accumulationBudget) / totalAccumulation;
                item.accumulatedPriority = 0;
                const exists = entityExists(entity);
                if (item.normalizedPriority >= 1 || !exists) {
                    if (exists) priorityEntities.add(entity);
                    queue.removeEntity(entity);
                }
            }
            totalAccumulation = 0;
        },
        priorityEntities: priorityEntities,
        accumulationBudget: args.accumulationBudget,
        reset: () => {
            totalAccumulation = 0;
            accumulatingPriorities.clear();
            priorityEntities.clear();
        },
    };

    return queue;
};

const minimumFrustumCullDistanceSqr = 5 * 5; // 5 units

const filterFrustumCulledEntities = entity =>
    !(
        DistanceFromCameraComponent.squaredDistance[entity] > minimumFrustumCullDistanceSqr &&
        FrustumCullCameraComponent.isCulled[entity]
    );

export const createSortAndApplyPriorityQueue = (query, comparisonFunction) => {
    let sortAccumulator = 0;

    return (priorityQueue, sortedTransformEntities, deltaSeconds) => {
        let needsSorting = false;
        sortAccumulator += deltaSeconds;
        if (sortAccumulator > 1) {
            needsSorting = true;
            sortAccumulator = 0;
        }

        for (const entity of query.enter()) {
            sortedTransformEntities.push(entity);
            needsSorting = true;
        }

        for (const entity of query.exit()) {
            const idx = sortedTransformEntities.indexOf(entity);
            idx > -1 && sortedTransformEntities.splice(idx, 1);
            needsSorting = true;
            priorityQueue.removeEntity(entity);
        }

        if (needsSorting && sortedTransformEntities.length > 1) {
            insertionSort(sortedTransformEntities, comparisonFunction);
        }

        const filteredSortedTransformEntities = [];
        for (let i = 0; i < sortedTransformEntities.length; i++) {
            if (filterFrustumCulledEntities(sortedTransformEntities[i]))
                filteredSortedTransformEntities.push(sortedTransformEntities[i]);
        }

        for (let i = 0; i < filteredSortedTransformEntities.length; i++) {
            const entity = filteredSortedTransformEntities[i];
            const accumulation = Math.min(Math.exp(1 / (i + 1)) / 3, 1);
            priorityQueue.addPriority(entity, accumulation * accumulation);
        }

        priorityQueue.update();
    };
};
