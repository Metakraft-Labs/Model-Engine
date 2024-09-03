import { getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { XRUIComponent } from "../../../spatial/xrui/components/XRUIComponent";

import { createModalView } from "../ui/InteractiveModalView";

/**
 * Creates and returns an xrUI on the specified entity
 * (this replaces createInteractUI and createNonInteractUI (by adding a bool isInteractable optional param)
 * @param entity  entity to add the xrUI to
 * @param uiMessage  text to display on the UI
 * @param isInteractable  (optional, default = true) sets whether the UI is interactable or not
 */
export function createUI(entity, uiMessage, isInteractable = true) {
    const ui = createModalView(entity, uiMessage, isInteractable);

    const nameComponent = getComponent(entity, NameComponent);
    setComponent(ui.entity, NameComponent, "interact-ui-" + uiMessage + "-" + nameComponent);

    const xrui = getComponent(ui.entity, XRUIComponent);
    xrui.rootLayer.traverseLayersPreOrder(layer => {
        const mat = layer.contentMesh.material;
        mat.transparent = true;
    });
    const transform = getComponent(ui.entity, TransformComponent);
    transform.scale.setScalar(1);

    return ui;
}
