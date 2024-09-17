import { EventEmitter } from "../../../../VisualScriptModule";
import { BooleanValue, FloatValue, IntegerValue, StringValue } from "../../../ProfilesModule";
import { ColorValue } from "../../values/ColorValue";
import { EulerValue } from "../../values/EulerValue";
import { QuatValue } from "../../values/QuatValue";
import { Vec2Value } from "../../values/Vec2Value";
import { Vec3Value } from "../../values/Vec3Value";
import { Vec4Value } from "../../values/Vec4Value";

export class DummyScene {
    onSceneChanged = new EventEmitter();

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
        // pull in value type nodes
    }

    getProperty(jsonPath, valueTypeName) {
        return this.valueRegistry[valueTypeName]?.creator();
    }
    setProperty() {
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

    getProperties() {
        return [];
    }

    addOnSceneChangedListener() {
        console.log("added on scene changed listener");
    }

    removeOnSceneChangedListener() {
        console.log("removed on scene changed listener");
    }
}
