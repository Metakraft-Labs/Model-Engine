import { getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import {
    EntityTreeComponent,
    iterateEntityNode,
} from "../../../spatial/transform/components/EntityTree";

import { SourceComponent } from "../../../../scene/components/SourceComponent";
import { getModelSceneID } from "../../../../scene/functions/loaders/ModelFunctions";
import { ExporterExtension } from "./ExporterExtension";

export default class SourceHandlerExtension extends ExporterExtension {
    entitySet;
    constructor(writer) {
        super(writer);
        this.name = "EE_sourceHandler";
        this.entitySet = [];
    }

    beforeParse(input) {
        //we allow saving of any object that has a source equal to or parent of the root's source
        const validSrcs = new Set();
        if (!this.writer.options.srcEntity) return;
        validSrcs.add(getModelSceneID(this.writer.options.srcEntity));
        const root = Array.isArray(input) ? input[0] : input;
        let walker = root.entity;
        while (walker !== null) {
            const src = getComponent(walker, SourceComponent);
            if (src) validSrcs.add(src);
            walker = getComponent(walker, EntityTreeComponent)?.parentEntity ?? null;
        }
        iterateEntityNode(
            root.entity,
            entity => {
                const entityTree = getComponent(entity, EntityTreeComponent);
                if (!entityTree || !entityTree.parentEntity) return;
                this.entitySet.push({ entity, parent: entityTree.parentEntity });
                setComponent(entity, EntityTreeComponent, { parentEntity: UndefinedEntity });
            },
            entity => {
                const src = getComponent(entity, SourceComponent);
                return !!src && !validSrcs.has(src);
            },
        );
    }

    afterParse(input) {
        this.entitySet.forEach(({ entity, parent }) => {
            setComponent(entity, EntityTreeComponent, { parentEntity: parent });
        });
    }
}
