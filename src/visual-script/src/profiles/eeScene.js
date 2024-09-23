import { HyperFlux } from "../../../hyperflux";

import { EventEmitter } from "../engine/Events/EventEmitter";
import {
    BooleanValue,
    ColorValue,
    EulerValue,
    FloatValue,
    IntegerValue,
    QuatValue,
    StringValue,
    Vec2Value,
    Vec3Value,
    Vec4Value,
} from "./ProfilesModule";

export class EEScene {
    onSceneChanged = new EventEmitter();
    sceneVariables = {};
    statePropertiesPaths = {};
    valueRegistry;

    constructor() {
        this.valueRegistry = Object.fromEntries(
            [
                BooleanValue,
                StringValue,
                IntegerValue,
                FloatValue,
                Vec2Value,
                Vec3Value,
                Vec4Value,
                ColorValue,
                EulerValue,
                QuatValue,
            ].map(valueType => [valueType.name, valueType]),
        );
        Object.entries(HyperFlux.store?.stateMap).forEach(stateType => {
            const properties = {};
            Object.keys(stateType[1]).forEach(property => {
                properties[property] = property;
            });
            this.statePropertiesPaths[stateType[0]] = properties;
        });
        // pull in value type nodes
    }

    getProperty(jsonPath) {
        const pathKeys = jsonPath.split(".");
        let currentLevel = this.sceneVariables;

        for (const key of pathKeys) {
            if (!currentLevel[key]) {
                return undefined;
            }
            currentLevel = currentLevel[key];
        }

        return currentLevel;
    }

    setProperty(jsonPath, valueTypeName, value) {
        const pathKeys = jsonPath.split(".");
        value = value ?? this.valueRegistry[valueTypeName]?.creator();
        this.sceneVariables = pathKeys.reduceRight((acc, key) => ({ [key]: acc }), value);
        this.onSceneChanged.emit();
    }

    addOnClickedListener() {
        console.log("added on clicked listener");
    }

    removeOnClickedListener() {
        console.log("removed on clicked listener");
    }

    getQueryableProperties() {
        return [];
    }

    getRaycastableProperties() {
        return [];
    }

    getStateProperties(stateType) {
        const rootState = stateType
            ? this.statePropertiesPaths[stateType]
            : this.statePropertiesPaths;
        const paths = [];
        const stack = [{ node: rootState, path: "" }];

        while (stack.length > 0) {
            const { node, path } = stack.pop();
            for (const key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                    const newPath = path ? `${path}.${key}` : key;
                    if (typeof node[key] === "object") {
                        stack.push({ node: node[key], path: newPath });
                    } else {
                        paths.push(newPath);
                    }
                }
            }
        }

        return paths;
    }
    getProperties() {
        const paths = [];
        const stack = [{ node: this.sceneVariables, path: "" }];

        while (stack.length > 0) {
            const { node, path } = stack.pop();
            for (const key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                    const newPath = path ? `${path}.${key}` : key;
                    if (typeof node[key] === "object") {
                        stack.push({ node: node[key], path: newPath });
                    } else {
                        paths.push(newPath);
                    }
                }
            }
        }

        return paths;
    }

    addOnSceneChangedListener() {
        console.log("added on scene changed listener");
    }

    removeOnSceneChangedListener() {
        console.log("removed on scene changed listener");
    }
}
