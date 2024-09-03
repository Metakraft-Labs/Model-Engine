import { UUIDComponent } from "../../../ecs";
import {
    getAllComponents,
    getComponent,
    getOptionalComponent,
    hasComponent,
    serializeComponent,
} from "../../../ecs/ComponentFunctions";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { GLTFLoadedComponent } from "../components/GLTFLoadedComponent";

export const serializeEntity = entity => {
    const ignoreComponents = getOptionalComponent(entity, GLTFLoadedComponent);

    const jsonComponents = [];
    const components = getAllComponents(entity);

    for (const component of components) {
        const sceneComponentID = component.jsonID;
        if (sceneComponentID && !ignoreComponents?.includes(component.name)) {
            const data = serializeComponent(entity, component);
            if (data) {
                jsonComponents.push({
                    name: sceneComponentID,
                    props: data,
                });
            }
        }
    }
    return jsonComponents;
};

export const toEntityJson = entity => {
    const components = serializeEntity(entity);
    const result = {
        components,
        name: getOptionalComponent(entity, NameComponent) ?? "",
    };
    const parent = getOptionalComponent(entity, EntityTreeComponent)?.parentEntity;
    if (parent && hasComponent(parent, UUIDComponent)) {
        result.parent = getComponent(parent, UUIDComponent);
    }
    return result;
};

globalThis.serializeEntity = serializeEntity;
