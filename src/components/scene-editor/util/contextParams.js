import { generateUUID } from "three/src/math/MathUtils";
import { getState } from "../../../hyperflux";
import { LocationState } from "../social/services/LocationService";

/**
 * @function clientContextParams
 * @description This function will collect contextual parameters
 * from url's query params
 */
export function clientContextParams(params) {
    const locationState = getState(LocationState);
    return {
        ...params,
        event_id: generateUUID(),
        location_id: locationState.currentLocation.location.id,
        project_id: locationState.currentLocation.location.projectId,
    };
}
