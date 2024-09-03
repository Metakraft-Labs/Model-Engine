import * as bitECS from "bitecs";
import React from "react";
import { v4 as uuidv4 } from "uuid";

import { HyperFlux } from "../hyperflux";

import { removeAllComponents } from "./ComponentFunctions";
import { UndefinedEntity } from "./Entity";

export const createEntity = () => {
    return bitECS.addEntity(HyperFlux.store);
};

export const removeEntity = entity => {
    if (!entity || !entityExists(entity)) return []; ///throw new Error(`[removeEntity] ${entity} does not exist in the world`)

    removeAllComponents(entity);

    bitECS.removeEntity(HyperFlux.store, entity);
};

export const entityExists = entity => {
    return bitECS.entityExists(HyperFlux.store, entity);
};

export const EntityContext = React.createContext(UndefinedEntity);

export const useEntityContext = () => {
    return React.useContext(EntityContext);
};

export const generateEntityUUID = () => {
    return uuidv4();
};
