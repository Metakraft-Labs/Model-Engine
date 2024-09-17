import { useEffect } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import { UUIDComponent } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    getOptionalComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useExecute } from "../../../ecs/SystemFunctions";
import { getState } from "../../../hyperflux";
import { PhysicsSystem } from "../../../spatial";
import { EngineState } from "../../../spatial/EngineState";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { SplineComponent } from "./SplineComponent";

const _euler = new Euler();
const _quat = new Quaternion();

const _point1Vector = new Vector3();

export const SplineTrackComponent = defineComponent({
    name: "SplineTrackComponent",
    jsonID: "EE_spline_track",

    onInit: _entity => {
        return {
            alpha: 0, // internal
            splineEntityUUID,
            velocity: 1.0,
            enableRotation: false,
            lockToXZPlane: true,
            loop: true,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (typeof json.splineEntityUUID !== "undefined")
            component.splineEntityUUID.set(json.splineEntityUUID);
        if (typeof json.velocity === "number") component.velocity.set(json.velocity);
        if (typeof json.enableRotation === "boolean")
            component.enableRotation.set(json.enableRotation);
        if (typeof json.lockToXZPlane === "boolean")
            component.lockToXZPlane.set(json.lockToXZPlane);
        if (typeof json.loop === "boolean") component.loop.set(json.loop);
    },

    toJSON: (entity, component) => {
        return {
            splineEntityUUID: component.splineEntityUUID.value,
            velocity: component.velocity.value,
            enableRotation: component.enableRotation.value,
            lockToXZPlane: component.lockToXZPlane.value,
            loop: component.loop.value,
        };
    },

    reactor: function (props) {
        const entity = useEntityContext();
        const component = useComponent(entity, SplineTrackComponent);

        useExecute(
            () => {
                const { isEditor } = getState(EngineState);
                const { deltaSeconds } = getState(ECSState);
                if (isEditor) return;
                if (!component.splineEntityUUID.value) return;
                const splineTargetEntity = UUIDComponent.getEntityByUUID(
                    component.splineEntityUUID.value,
                );
                if (!splineTargetEntity) return;

                const splineComponent = getOptionalComponent(splineTargetEntity, SplineComponent);
                if (!splineComponent) return;

                // get local transform for this entity
                const transform = getOptionalComponent(entity, TransformComponent);
                if (!transform) return;

                const elements = splineComponent.elements;
                if (elements.length < 1) return;

                if (Math.floor(component.alpha.value) > elements.length - 1) {
                    if (!component.loop.value) {
                        //emit an event here?
                        return;
                    }
                    component.alpha.set(0);
                }
                component.alpha.set(
                    alpha =>
                        alpha +
                        (deltaSeconds * component.velocity.value) /
                            splineComponent.curve.getLength(), // todo cache length to avoid recalculating every frame
                );

                // move along spline
                const alpha = component.alpha.value;
                const index = Math.floor(component.alpha.value);
                const nextIndex = index + 1 > elements.length - 1 ? 0 : index + 1;

                // prevent a possible loop around hiccup; if no loop then do not permit modulo 0
                if (!component.loop.value && index > nextIndex) return;

                const splineTransform = getComponent(splineTargetEntity, TransformComponent);

                // translation
                splineComponent.curve.getPointAt(alpha - index, _point1Vector);
                transform.position.copy(_point1Vector);

                // rotation
                const q1 = elements[index].quaternion;
                const q2 = elements[nextIndex].quaternion;

                if (component.enableRotation.value) {
                    if (component.lockToXZPlane.value) {
                        // get X and Y rotation only
                        _euler.setFromQuaternion(q1);
                        _euler.z = 0;

                        transform.rotation.setFromEuler(_euler);

                        _euler.setFromQuaternion(q2);
                        _euler.z = 0;

                        _quat.setFromEuler(_euler);

                        transform.rotation.fastSlerp(_quat, alpha - index);
                    } else {
                        transform.rotation.copy(q1).fastSlerp(q2, alpha - index);
                    }
                }

                /** @todo optimize this */
                transform.matrix.compose(transform.position, transform.rotation, transform.scale);
                // apply spline transform
                transform.matrix.premultiply(splineTransform.matrix);
                transform.matrix.decompose(transform.position, transform.rotation, transform.scale);

                // update local transform for target
                const parentEntity = getComponent(entity, EntityTreeComponent).parentEntity;
                if (!parentEntity) return;
                const parentTransform = getComponent(parentEntity, TransformComponent);
                transform.matrix
                    .premultiply(mat4.copy(parentTransform.matrixWorld).invert())
                    .decompose(transform.position, transform.rotation, transform.scale);
            },
            { before: PhysicsSystem },
        );

        useEffect(() => {
            if (!component.splineEntityUUID.value) return;
            const splineTargetEntity = UUIDComponent.getEntityByUUID(
                component.splineEntityUUID.value,
            );
            if (!splineTargetEntity) return;
            const splineComponent = getOptionalComponent(splineTargetEntity, SplineComponent);
            if (!splineComponent) return;
            splineComponent.curve.closed = component.loop.value;
        }, [component.loop]);

        return null;
    },
});

const mat4 = new Matrix4();
