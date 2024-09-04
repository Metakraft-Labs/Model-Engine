import { Choices } from "../../../engine/Sockets/Socket";

export interface IScene {
    getProperty(jsonPath, valueTypeName);
    setProperty(jsonPath, valueTypeName, value);
    addOnClickedListener(jsonPath, callback;
    removeOnClickedListener(jsonPath, callback;
    getRaycastableProperties: () => Choices;
    getProperties: () => Choices;
    addOnSceneChangedListener(listener);
    removeOnSceneChangedListener(listener);
}
