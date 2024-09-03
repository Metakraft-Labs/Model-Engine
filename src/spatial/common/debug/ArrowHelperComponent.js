import { ArrowHelper, Vector3 } from "three";
import { useDidMount } from "../../../common/src/utils/useDidMount";
import { defineComponent, useComponent, useEntityContext } from "../../../ecs";
import { useDisposable } from "../../resources/resourceHooks";
import { matchesColor, matchesVector3 } from "../functions/MatchesUtils";
import { useHelperEntity } from "./DebugComponentUtils";

export const ArrowHelperComponent = defineComponent({
    name: "ArrowHelperComponent",

    onInit: entity => {
        return {
            name: "arrow-helper",
            dir: new Vector3(0, 0, 1),
            origin: new Vector3(0, 0, 0),
            length: 0.5,
            color: 0xffffff,
            headLength,
            headWidth,
            entity,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (typeof json.name === "string") component.name.set(json.name);
        if (matchesVector3.test(json.dir)) component.dir.set(json.dir);
        if (matchesVector3.test(json.origin)) component.origin.set(json.origin);
        if (typeof json.length === "number") component.length.set(json.length);
        if (matchesColor.test(json.color)) component.color.set(json.color);
        if (typeof json.headLength === "number") component.headLength.set(json.headLength);
        if (typeof json.headWidth === "number") component.headWidth.set(json.headWidth);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, ArrowHelperComponent);
        const [helper] = useDisposable(
            ArrowHelper,
            entity,
            component.dir.value,
            // Origin value isn't updatable in ArrowHelper
            component.origin.value,
            component.length.value,
            component.color.value,
            component.headLength.value,
            component.headWidth.value,
        );
        useHelperEntity(entity, component, helper);

        useDidMount(() => {
            helper.setDirection(component.dir.value);
            helper.setColor(component.color.value);
            helper.setLength(
                component.length.value,
                component.headLength.value,
                component.headWidth.value,
            );
        }, [
            component.dir,
            component.length,
            component.color,
            component.headLength,
            component.headWidth,
        ]);

        return null;
    },
});
