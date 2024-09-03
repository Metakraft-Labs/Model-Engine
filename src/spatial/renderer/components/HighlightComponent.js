import { defineQuery, defineSystem, Engine } from "../../../ecs";
import { defineComponent, getComponent, hasComponent } from "../../../ecs/ComponentFunctions";

import { traverseEntityNode } from "../../transform/components/EntityTree";
import { RendererComponent } from "../WebGLRendererSystem";
import { GroupComponent } from "./GroupComponent";
import { MeshComponent } from "./MeshComponent";
import { VisibleComponent } from "./VisibleComponent";

export const HighlightComponent = defineComponent({ name: "HighlightComponent" });

const highlightQuery = defineQuery([HighlightComponent, VisibleComponent]);

const execute = () => {
    /** @todo support multiple scenes */
    if (!hasComponent(Engine.instance.viewerEntity, RendererComponent)) return;

    const highlightObjects = new Set();
    for (const entity of highlightQuery()) {
        traverseEntityNode(entity, (child, index) => {
            if (!hasComponent(child, MeshComponent)) return;
            if (!hasComponent(child, GroupComponent)) return;
            if (!hasComponent(child, VisibleComponent)) return;
            highlightObjects.add(getComponent(child, MeshComponent));
        });
    }
    const rendererComponent = getComponent(Engine.instance.viewerEntity, RendererComponent);
    rendererComponent.effectComposer?.OutlineEffect?.selection.set(highlightObjects);
};

export const HighlightSystem = defineSystem({
    uuid: "HighlightSystem",
    insert: { beforeSystem },
    execute,
});
