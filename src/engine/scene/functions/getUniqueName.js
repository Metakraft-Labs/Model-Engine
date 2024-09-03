import { getOptionalComponent } from "../../../ecs/ComponentFunctions";
import { NameComponent } from "../../../spatial/common/NameComponent";

const namePattern = new RegExp("(.*) \\d+$");

function getNameWithoutIndex(name) {
    let cacheName = name;
    const match = namePattern.exec(name);
    if (match) {
        cacheName = match[1];
    }
    return cacheName;
}

export function getUniqueName(node, templateName = "New Object") {
    const nodeNameComp = getOptionalComponent(node, NameComponent) ?? templateName;
    const nameWithoutIndex = getNameWithoutIndex(nodeNameComp);

    let empty = false;
    let counter = 0;

    while (!empty) {
        const name = nameWithoutIndex + (counter > 0 ? " " + (counter + 1) : "");
        if (!NameComponent.entitiesByName[name]?.length) {
            empty = true;
            break;
        }
        counter++;
    }

    return nameWithoutIndex + (counter > 0 ? " " + (counter + 1) : "");
}
