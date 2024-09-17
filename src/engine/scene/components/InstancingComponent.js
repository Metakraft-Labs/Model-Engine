import { InstancedBufferAttribute } from "three";

import { defineComponent } from "../../../ecs/ComponentFunctions";

export const InstancingComponent = defineComponent({
    name: "InstancingComponent",
    jsonID: "EE_instancing",
    onInit: _entity => ({
        instanceMatrix: new InstancedBufferAttribute(new Float32Array(16), 16),
    }),
    onSet: (entity, component, json) => {
        if (!json) return;
        if (json.instanceMatrix instanceof InstancedBufferAttribute) {
            component.instanceMatrix.set(json.instanceMatrix);
        } else if (Array.isArray(json.instanceMatrix)) {
            component.instanceMatrix.value.set(json.instanceMatrix);
        }
    },
});
