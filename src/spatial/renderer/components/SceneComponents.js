import { defineComponent } from "../../../ecs";

export const SceneComponent = defineComponent({
    name: "SceneComponent",
});

export const BackgroundComponent = defineComponent({
    name: "BackgroundComponent",

    onInit(entity) {
        return null;
    },

    onSet(entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});

export const EnvironmentMapComponent = defineComponent({
    name: "EnvironmentMapComponent",

    onInit(entity) {
        return null;
    },

    onSet(entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});

export const FogComponent = defineComponent({
    name: "FogComponent",

    onInit(entity) {
        return null;
    },

    onSet(entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});
