import {
    defineComponent,
    getMutableComponent,
    getOptionalMutableComponent,
    removeComponent,
    setComponent,
} from "../../../ecs";
import { none } from "../../../hyperflux";

export const ResourcePendingComponent = defineComponent({
    name: "ResourcePendingComponent",

    onInit(_entity) {
        return {};
    },

    setResource(entity, url, progress, total) {
        setComponent(entity, ResourcePendingComponent);

        const component = getMutableComponent(entity, ResourcePendingComponent);
        component[url].set({ progress, total });
    },

    removeResource(entity, url) {
        const component = getOptionalMutableComponent(entity, ResourcePendingComponent);
        if (!component) return;
        if (!component[url].value) return;

        component[url].set(none);

        if (!component.keys.length) {
            removeComponent(entity, ResourcePendingComponent);
        }
    },
});
