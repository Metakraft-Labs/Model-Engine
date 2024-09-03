import {
    defineComponent,
    hasComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";

export const VisibleComponent = defineComponent({
    name: "VisibleComponent",
    jsonID: "EE_visible",
    toJSON: () => true,
});

export const setVisibleComponent = (entity, visible) => {
    if (visible) {
        !hasComponent(entity, VisibleComponent) && setComponent(entity, VisibleComponent, true);
    } else removeComponent(entity, VisibleComponent);
};
