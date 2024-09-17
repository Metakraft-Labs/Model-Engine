import { useEffect } from "react";
import { CatmullRomCurve3, Quaternion, Vector3 } from "three";

import {
    defineComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, useHookstate } from "../../../hyperflux";
import { Vector3_Up } from "../../../spatial/common/constants/MathConstants";
import { RendererState } from "../../../spatial/renderer/RendererState";

import { SplineHelperComponent } from "./debug/SplineHelperComponent";

export const SplineComponent = defineComponent({
    name: "SplineComponent",
    jsonID: "EE_spline",

    onInit: _entity => {
        return {
            elements: [
                { position: new Vector3(-1, 0, -1), quaternion: new Quaternion() },
                {
                    position: new Vector3(1, 0, -1),
                    quaternion: new Quaternion().setFromAxisAngle(Vector3_Up, Math.PI / 2),
                },
                {
                    position: new Vector3(1, 0, 1),
                    quaternion: new Quaternion().setFromAxisAngle(Vector3_Up, Math.PI),
                },
                {
                    position: new Vector3(-1, 0, 1),
                    quaternion: new Quaternion().setFromAxisAngle(Vector3_Up, (3 * Math.PI) / 2),
                },
            ],
            // internal
            curve: new CatmullRomCurve3([], true),
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        json.elements &&
            component.elements.set(
                json.elements.map(e => ({
                    position: new Vector3().copy(e.position),
                    quaternion: new Quaternion().copy(e.quaternion),
                })),
            );
    },

    toJSON: (entity, component) => {
        return { elements: component.elements.get({ noproxy: true }) };
    },

    reactor: () => {
        const entity = useEntityContext();
        const component = useComponent(entity, SplineComponent);
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const elements = component.elements;

        useEffect(() => {
            if (elements.length < 3) {
                component.curve.set(new CatmullRomCurve3([], true));
                return;
            }

            const curve = new CatmullRomCurve3(
                elements.value.map(e => e.position),
                true,
            );
            curve.curveType = "catmullrom";
            component.curve.set(curve);
        }, [
            elements.length,
            // force a unique dep change upon any position or quaternion change
            elements.value
                .map(e => `${JSON.stringify(e.position)}${JSON.stringify(e.quaternion)})`)
                .join(""),
        ]);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, SplineHelperComponent);
            }

            return () => {
                removeComponent(entity, SplineHelperComponent);
            };
        }, [debugEnabled]);

        return null;
    },
});
