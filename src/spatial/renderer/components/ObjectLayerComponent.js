import { Types } from "bitecs";

import { entityExists } from "../../../ecs";
import {
    defineComponent,
    hasComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";

const maxBitWidth = 32;

export const ObjectLayerComponents = Array.from({ length: maxBitWidth }, (_, i) => {
    return defineComponent({
        name: `ObjectLayer${i}`,

        onSet(entity) {
            ObjectLayerMaskComponent.mask[entity] |= (1 << i) | 0;
        },

        onRemove(entity) {
            ObjectLayerMaskComponent.mask[entity] &= ~((1 << i) | 0);
        },
    });
});

export const ObjectLayerMaskDefault = 1 << 0; // enable layer 0

export const ObjectLayerMaskComponent = defineComponent({
    name: "ObjectLayerMaskComponent",
    schema: { mask: Types.i32 },

    onInit(_entity) {
        return ObjectLayerMaskDefault; // enable layer 0
    },

    /**
     * @description
     * Takes a layer mask as a parameter, not a layer (eg. layer mask with value 256 enables layer 8)
     * ```ts
     * // Incorrect usage
     * setComponent(entity, ObjectLayerMaskComponent, ObjectLayers.NodeHelper)
     *
     * // Correct usage
     * setComponent(entity, ObjectLayerMaskComponent, ObjectLayerMasks.NodeHelper)
     * ```
     */
    onSet(_entity, component, mask = ObjectLayerMaskDefault) {
        for (let i = 0; i < maxBitWidth; i++) {
            const isSet = (mask & ((1 << i) | 0)) !== 0;
            if (isSet) {
                setComponent(entity, ObjectLayerComponents[i]);
            } else {
                removeComponent(entity, ObjectLayerComponents[i]);
            }
        }
        component.set(mask);
        ObjectLayerMaskComponent.mask[entity] = mask;
    },

    onRemove(entity, component) {
        for (let i = 0; i < maxBitWidth; i++) {
            removeComponent(entity, ObjectLayerComponents[i]);
        }
        component.set(0);
    },

    toJSON(entity, component) {
        return component.value;
    },

    setLayer(entity, layer) {
        const mask = ((1 << layer) | 0) >>> 0;
        setComponent(entity, ObjectLayerMaskComponent, mask);
    },

    enableLayer(entity, layer) {
        if (!entityExists(entity)) return;
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
        setComponent(entity, ObjectLayerComponents[layer]);
    },

    enableLayers(entity, ...layers) {
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
        for (const layer of layers) {
            setComponent(entity, ObjectLayerComponents[layer]);
        }
    },

    disableLayer(entity, layer) {
        if (!entityExists(entity)) return;
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
        removeComponent(entity, ObjectLayerComponents[layer]);
    },

    disableLayers(entity, ...layers) {
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
        for (const layer of layers) {
            removeComponent(entity, ObjectLayerComponents[layer]);
        }
    },

    toggleLayer(entity, layer) {
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
        const ObjectLayerComponent = ObjectLayerComponents[layer];
        if (hasComponent(entity, ObjectLayerComponent)) {
            removeComponent(entity, ObjectLayerComponent);
        } else {
            setComponent(entity, ObjectLayerComponent);
        }
    },

    setMask(entity, mask) {
        setComponent(entity, ObjectLayerMaskComponent, mask);
    },
});

export class Layer {
    constructor(entity) {
        if (!hasComponent(entity, ObjectLayerMaskComponent))
            setComponent(entity, ObjectLayerMaskComponent);
    }

    get mask() {
        return ObjectLayerMaskComponent.mask[this.entity];
    }

    set mask(val) {
        setComponent(this.entity, ObjectLayerMaskComponent, val);
    }

    set(channel) {
        ObjectLayerMaskComponent.setLayer(this.entity, channel);
    }

    enable(channel) {
        ObjectLayerMaskComponent.enableLayer(this.entity, channel);
    }

    enableAll() {
        ObjectLayerMaskComponent.setMask(this.entity, -1);
    }

    toggle(channel) {
        ObjectLayerMaskComponent.toggleLayer(this.entity, channel);
    }

    disable(channel) {
        ObjectLayerMaskComponent.disableLayer(this.entity, channel);
    }

    disableAll() {
        ObjectLayerMaskComponent.setMask(this.entity, 0);
    }

    test(layers) {
        return (this.mask & layers.mask) !== 0;
    }

    isEnabled(channel) {
        return (this.mask & ((1 << channel) | 0)) !== 0;
    }
}

/**
 * @deprecated use ObjectLayerMaskComponent instead
 */
export function setObjectLayers(object, ...layers) {
    object.traverse(obj => {
        obj.layers.disableAll();
        for (const layer of layers) {
            obj.layers.enable(layer);
        }
    });
}

/**
 * @deprecated use ObjectLayerMaskComponent instead
 */
export function enableObjectLayer(object, layer, enable) {
    object.traverse(obj => {
        enable ? obj.layers.enable(layer) : obj.layers.disable(layer);
    });
}
