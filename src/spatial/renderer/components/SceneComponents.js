import { defineComponent } from "../../../ecs";

export const SceneComponent = defineComponent({
    name: "SceneComponent",
});

export const BackgroundComponent = defineComponent({
    name: "BackgroundComponent",

    onInit(_entity) {
        return null;
    },

    onSet(_entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});

export const EnvironmentMapComponent = defineComponent({
    name: "EnvironmentMapComponent",

    onInit(_entity) {
        return null;
    },

    onSet(_entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});

export const FogComponent = defineComponent({
    name: "FogComponent",

    onInit(_entity) {
        return null;
    },

    onSet(_entity, component, json) {
        if (typeof json === "object") component.set(json);
    },
});
