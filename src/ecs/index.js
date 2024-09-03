import "../hyperflux";

import { getAllEntities, Not, Types } from "bitecs";

import {
    defineComponent,
    getAllComponentData,
    getAllComponents,
    getComponent,
    getMutableComponent,
    getOptionalComponent,
    getOptionalMutableComponent,
    hasComponent,
    removeAllComponents,
    removeComponent,
    serializeComponent,
    setComponent,
    updateComponent,
    useComponent,
    useOptionalComponent,
} from "./ComponentFunctions";
import { executeFixedSystem, executeSystems, getDAG } from "./EngineFunctions";
import { UndefinedEntity } from "./Entity";
import { createEntity, entityExists, removeEntity, useEntityContext } from "./EntityFunctions";
import { defineQuery, QueryReactor, removeQuery, useQuery } from "./QueryFunctions";
import { defineSystem, destroySystem, executeSystem, useExecute } from "./SystemFunctions";
import { UUIDComponent } from "./UUIDComponent";

const ECS = {
    /** Component API */
    defineComponent,
    getOptionalMutableComponent,
    getMutableComponent,
    getOptionalComponent,
    getComponent,
    setComponent,
    updateComponent,
    hasComponent,
    removeComponent,
    getAllComponents,
    getAllComponentData,
    removeAllComponents,
    serializeComponent,
    useComponent,
    useOptionalComponent,
    UUIDComponent,
    /** Entity API */
    createEntity,
    removeEntity,
    entityExists,
    useEntityContext,
    UndefinedEntity,
    /** System API */
    executeSystem,
    defineSystem,
    useExecute,
    destroySystem,
    /** Queries */
    defineQuery,
    removeQuery,
    useQuery,
    QueryReactor,
    /** Pipeline Functions */
    executeSystems,
    executeFixedSystem,
    getDAG,
    /** bitECS Functions */
    Not,
    Types,
    getAllEntities,
};

globalThis.ECS = ECS;

export default ECS;

export { Not } from "bitecs";
export * from "./ComponentFunctions";
export * from "./ECSState";
export * from "./Engine";
export * from "./EngineFunctions";
export * from "./Entity";
export * from "./EntityFunctions";
export * from "./QueryFunctions";
export * from "./SystemFunctions";
export * from "./SystemGroups";
export * from "./Timer";
export * from "./UUIDComponent";
export { ECS };
