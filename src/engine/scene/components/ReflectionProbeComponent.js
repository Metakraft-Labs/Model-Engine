import { useEffect } from "react";
import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import { addError } from "../functions/ErrorFunctions";

export const ReflectionProbeComponent = defineComponent({
    name: "ReflectionProbeComponent",
    jsonID: "IR_reflectionProbe",
    onInit: () => ({
        src: "",
        // internal
        texture: null,
    }),
    toJSON: (_entity, component) => ({
        src: component.src.value,
    }),
    onSet: (_entity, component, json) => {
        if (typeof json === "undefined") return;
        if (typeof json.src === "string") {
            component.src.set(json.src);
        }
    },
    errors: ["LOADING_ERROR"],
    reactor: () => {
        const entity = useEntityContext();
        const probeComponent = useComponent(entity, ReflectionProbeComponent);

        const [probeTexture, error] = useTexture(probeComponent.src.value, entity);

        useEffect(() => {
            if (!probeTexture) return;
            probeComponent.texture.set(probeTexture);
        }, [probeTexture]);

        useEffect(() => {
            if (!error) return;
            probeComponent.texture.set(null);
            addError(
                entity,
                ReflectionProbeComponent,
                "LOADING_ERROR",
                "Failed to load reflection probe texture.",
            );
        });
    },
});
