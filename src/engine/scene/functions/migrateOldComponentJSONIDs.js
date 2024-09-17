import { ComponentJSONIDMap } from "../../../ecs";

export const migrateOldComponentJSONIDs = json => {
    for (const [_uuid, entityJson] of Object.entries(json.entities)) {
        for (const component of entityJson.components) {
            if (component.name.startsWith("EE_") || component.name === "collider") continue;

            const newJsonID = "EE_" + component.name.replace("-", "_");

            const newComponent = ComponentJSONIDMap.has(newJsonID);
            if (!newComponent) continue;

            console.log("Migrating old component", component.name, "to", newJsonID);
            component.name = newJsonID;
        }
    }
};
