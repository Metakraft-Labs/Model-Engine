import * as bitECS from "bitecs";
import { getAllEntities } from "bitecs";
import * as Hyperflux from "../hyperflux";
import { getState, ReactorReconciler } from "../hyperflux";
import { createHyperStore, disposeStore, HyperFlux } from "../hyperflux/StoreFunctions";
import { EngineState } from "../spatial/EngineState";
import { ECSState } from "./ECSState";
import { removeEntity } from "./EntityFunctions";
import { removeQuery } from "./QueryFunctions";
import { SystemState } from "./SystemState";

export class Engine {
    static instance;

    /**
     * @deprecated use "Engine.instance.store.userID" instead
     * The uuid of the logged-in user
     */
    get userID() {
        return Engine.instance.store.userID;
    }

    store;

    /**
     * Represents the reference space of the xr session local floor.
     * @deprecated use "getState(EngineState).localFloorEntity" instead
     */
    get localFloorEntity() {
        return getState(EngineState).localFloorEntity;
    }

    /**
     * Represents the reference space for the absolute origin of the rendering context.
     * @deprecated use "getState(EngineState).originEntity" instead
     */
    get originEntity() {
        return getState(EngineState).originEntity;
    }

    /**
     * Represents the reference space for the viewer.
     * @deprecated use "getState(EngineState).viewerEntity" instead
     */
    get viewerEntity() {
        return getState(EngineState).viewerEntity;
    }

    /** @deprecated use viewerEntity instead */
    get cameraEntity() {
        return this.viewerEntity;
    }
}

globalThis.Engine = Engine;
globalThis.Hyperflux = Hyperflux;

export function createEngine(hyperstore = createHyperStore({ publicPath: "" })) {
    if (Engine.instance) throw new Error("Store already exists");
    Engine.instance = new Engine();
    hyperstore.getCurrentReactorRoot = () =>
        getState(SystemState).activeSystemReactors.get(getState(SystemState).currentSystemUUID);
    hyperstore.getDispatchTime = () => getState(ECSState).simulationTime;
    const store = bitECS.createWorld(hyperstore);
    Engine.instance.store = store;
    HyperFlux.store = { ...hyperstore, ...store };
}

export async function destroyEngine() {
    getState(ECSState).timer?.clear();

    /** Remove all entities */
    const entities = getAllEntities(HyperFlux.store);

    ReactorReconciler.flushSync(() => {
        for (const entity of entities) removeEntity(entity);
    });

    for (const query of getState(SystemState).reactiveQueryStates) {
        removeQuery(query.query);
    }

    disposeStore();

    /** @todo include in next bitecs update */
    // bitecs.deleteWorld(Engine.instance)
    Engine.instance = null;
}
