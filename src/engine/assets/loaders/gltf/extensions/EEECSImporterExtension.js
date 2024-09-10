import { ComponentJSONIDMap } from "../../../../../ecs/ComponentFunctions";

import { UUIDComponent, generateEntityUUID } from "../../../../../ecs";
import { ImporterExtension } from "./ImporterExtension";

export default class EEECSImporterExtension extends ImporterExtension {
    name = "EE_ecs";

    beforeRoot() {
        const parser = this.parser;
        const json = parser.json;
        const useVisible =
            !!json.extensionsUsed?.includes(this.name) ||
            !!json.extensionsUsed?.includes("EE_visible");
        const nodeCount = json.nodes?.length || 0;
        for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
            const nodeDef = json.nodes[nodeIndex];

            if (useVisible) {
                nodeDef.extras ??= {};
                nodeDef.extras.useVisible = true;
            }

            // CURRENT ECS EXTENSION FORMAT //../../..
            const ecsExtensions = nodeDef.extensions ?? {};
            const componentJson = [];
            for (const jsonID of Object.keys(ecsExtensions)) {
                const component = ComponentJSONIDMap.get(jsonID);
                if (!component) {
                    continue;
                }
                //@todo: comprehensive solution to loading the same file multiple times
                if (component === UUIDComponent) {
                    const uuid = ecsExtensions[jsonID];
                    //check if uuid already exists
                    if (UUIDComponent.entitiesByUUIDState[uuid]?.value) {
                        //regenerate uuid if it already exists
                        ecsExtensions[jsonID] = generateEntityUUID();
                    }
                }
                const compData = ecsExtensions[jsonID];
                componentJson.push({
                    name: jsonID,
                    props: compData,
                });
            }
            if (componentJson.length > 0) {
                nodeDef.extras ??= {};
                nodeDef.extras.componentJson = componentJson;
            }
            // - //

            // LEGACY ECS EXTENSION FORMAT //
            if (!nodeDef.extensions?.[this.name]) continue;
            const extensionDef = nodeDef.extensions[this.name];
            const containsECSData =
                !!extensionDef.data && extensionDef.data.some(([k]) => k.startsWith("xrengine."));
            if (!containsECSData) continue;
            nodeDef.extras ??= {};
            nodeDef.extras.ecsData = extensionDef.data;
            // - //
        }
        return null;
    }
}
