import { useEffect } from "react";
import { LineBasicMaterial, LineSegments } from "three";

import { defineComponent, setComponent, useComponent, useEntityContext } from "../../../ecs";
import { NO_PROXY } from "../../../hyperflux";

import {
    matchesColor,
    matchesGeometry,
    matchesMaterial,
} from "../../common/functions/MatchesUtils";
import { NameComponent } from "../../common/NameComponent";
import { useDisposable, useResource } from "../../resources/resourceHooks";
import { ObjectLayers } from "../constants/ObjectLayers";
import { addObjectToGroup, removeObjectFromGroup } from "./GroupComponent";
import { ObjectLayerMaskComponent } from "./ObjectLayerComponent";
import { setVisibleComponent } from "./VisibleComponent";

export const LineSegmentComponent = defineComponent({
    name: "LineSegmentComponent",

    onInit: entity => {
        return {
            name: "line-segment",
            geometry,
            material: new LineBasicMaterial() & { color },
            color,
            layerMask: ObjectLayers.NodeHelper,
            entity,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (typeof json.name === "string") component.name.set(json.name);

        if (matchesGeometry.test(json.geometry)) component.geometry.set(json.geometry);
        else throw new Error("LineSegmentComponent: Geometry required for LineSegmentComponent");

        if (matchesMaterial.test(json.material)) component.material.set(json.material);
        if (matchesColor.test(json.color)) component.color.set(json.color);
        if (typeof json.layerMask === "number") component.layerMask.set(json.layerMask);
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, LineSegmentComponent);
        const [geometryState] = useResource(
            component.geometry.value,
            entity,
            component.geometry.uuid.value,
        );
        const [materialState] = useResource(
            component.material.value,
            entity,
            component.material.uuid.value,
        );
        const [lineSegment] = useDisposable(
            LineSegments,
            entity,
            geometryState.value,
            materialState.value,
        );

        useEffect(() => {
            addObjectToGroup(entity, lineSegment);
            setVisibleComponent(entity, true);
            return () => {
                removeObjectFromGroup(entity, lineSegment);
            };
        }, []);

        useEffect(() => {
            setComponent(entity, NameComponent, component.name.value);
        }, [component.name]);

        useEffect(() => {
            setComponent(entity, ObjectLayerMaskComponent, component.layerMask.value);
        }, [component.layerMask]);

        useEffect(() => {
            const color = component.color.value;
            if (!color) return;
            const mat = component.material.get(NO_PROXY) & { color };
            mat.color.set(color);
            mat.needsUpdate = true;
        }, [component.color]);

        useEffect(() => {
            const geo = component.geometry.get(NO_PROXY);
            if (geo != geometryState.value) {
                geometryState.set(geo);
                lineSegment.geometry = geo;
            }
        }, [component.geometry]);

        useEffect(() => {
            const mat = component.material.get(NO_PROXY);
            if (mat != materialState.value) {
                materialState.set(component.material.get(NO_PROXY));
                lineSegment.material = mat;
            }
            mat.needsUpdate = true;
        }, [component.material]);

        return null;
    },
});
