import { defineComponent } from "../../../ecs/ComponentFunctions";

export const DefaultKillHeight = -10;

export const SceneSettingsComponent = defineComponent({
    name: "SceneSettingsComponent",
    jsonID: "EE_scene_settings",

    onInit() {
        return {
            thumbnailURL: "",
            loadingScreenURL: "",
            primaryColor: "#000000",
            backgroundColor: "#FFFFFF",
            alternativeColor: "#000000",
            sceneKillHeight: DefaultKillHeight,
            spectateEntity,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (typeof json.thumbnailURL === "string") component.thumbnailURL.set(json.thumbnailURL);
        if (typeof json.loadingScreenURL === "string")
            component.loadingScreenURL.set(json.loadingScreenURL);
        if (typeof json.primaryColor === "string") component.primaryColor.set(json.primaryColor);
        if (typeof json.backgroundColor === "string")
            component.backgroundColor.set(json.backgroundColor);
        if (typeof json.alternativeColor === "string")
            component.alternativeColor.set(json.alternativeColor);
        if (typeof json.sceneKillHeight === "number")
            component.sceneKillHeight.set(json.sceneKillHeight);
        if (typeof json.spectateEntity === "string")
            component.spectateEntity.set(json.spectateEntity);
    },

    toJSON: (_entity, component) => {
        return {
            thumbnailURL: component.thumbnailURL.value,
            loadingScreenURL: component.loadingScreenURL.value,
            primaryColor: component.primaryColor.value,
            backgroundColor: component.backgroundColor.value,
            alternativeColor: component.alternativeColor.value,
            sceneKillHeight: component.sceneKillHeight.value,
            spectateEntity: component.spectateEntity.value,
        };
    },
});
