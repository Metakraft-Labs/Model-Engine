import { Types } from "bitecs";

import { useEntityContext } from "../../../ecs";
import {
    defineComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";

import { useEffect } from "react";
import { proxifyQuaternion, proxifyVector3 } from "../../common/proxies/createThreejsProxy";
import { Physics } from "../classes/Physics";
import { BodyTypes } from "../types/PhysicsTypes";

const { f64 } = Types;
const Vector3Schema = { x: f64, y: f64, z: f64 };
const QuaternionSchema = { x: f64, y: f64, z: f64, w: f64 };
const SCHEMA = {
    previousPosition: Vector3Schema,
    previousRotation: QuaternionSchema,
    position: Vector3Schema,
    rotation: QuaternionSchema,
    targetKinematicPosition: Vector3Schema,
    targetKinematicRotation: QuaternionSchema,
    linearVelocity: Vector3Schema,
    angularVelocity: Vector3Schema,
};

export const RigidBodyComponent = defineComponent({
    name: "RigidBodyComponent",
    jsonID: "EE_rigidbody",
    schema: SCHEMA,

    onInit(_entity) {
        return {
            type: "fixed",
            ccd: false,
            allowRolling: true,
            enabledRotations: [true, true, true],
            // rigidbody desc values
            canSleep: true,
            gravityScale: 1,
            // internal
            /** @deprecated  @todo make the physics api properly reactive to remove this property  */
            initialized: false,
            previousPosition: proxifyVector3(this.previousPosition, entity),
            previousRotation: proxifyQuaternion(this.previousRotation, entity),
            position: proxifyVector3(this.position, entity),
            rotation: proxifyQuaternion(this.rotation, entity),
            targetKinematicPosition: proxifyVector3(this.targetKinematicPosition, entity),
            targetKinematicRotation: proxifyQuaternion(this.targetKinematicRotation, entity),
            linearVelocity: proxifyVector3(this.linearVelocity, entity),
            angularVelocity: proxifyVector3(this.angularVelocity, entity),
            /** If multiplier is 0, ridigbody moves immediately to target pose, linearly interpolating between substeps */
            targetKinematicLerpMultiplier: 0,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;

        if (typeof json.type === "string") component.type.set(json.type);
        if (typeof json.ccd === "boolean") component.ccd.set(json.ccd);
        if (typeof json.allowRolling === "boolean") component.allowRolling.set(json.allowRolling);
        if (typeof json.canSleep === "boolean") component.canSleep.set(json.canSleep);
        if (typeof json.gravityScale === "number") component.gravityScale.set(json.gravityScale);
        if (
            Array.isArray(json.enabledRotations) &&
            json.enabledRotations.length === 3 &&
            typeof json.enabledRotations[0] === "boolean" &&
            typeof json.enabledRotations[1] === "boolean" &&
            typeof json.enabledRotations[2] === "boolean"
        ) {
            component.enabledRotations.set(json.enabledRotations);
        }
    },

    toJSON: (_entity, component) => {
        return {
            type: component.type.value,
            ccd: component.ccd.value,
            allowRolling: component.allowRolling.value,
            enabledRotations: component.enabledRotations.value,
            canSleep: component.canSleep.value,
            gravityScale: component.gravityScale.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const component = useComponent(entity, RigidBodyComponent);
        const physicsWorld = Physics.useWorld(entity);

        useEffect(() => {
            if (!physicsWorld) return;
            Physics.createRigidBody(physicsWorld, entity);
            component.initialized.set(true);
            return () => {
                Physics.removeRigidbody(physicsWorld, entity);
                if (!hasComponent(entity, RigidBodyComponent)) return;
                component.initialized.set(false);
            };
        }, [physicsWorld]);

        useEffect(() => {
            if (!physicsWorld) return;
            const type = component.type.value;
            setComponent(entity, getTagComponentForRigidBody(type));
            Physics.setRigidBodyType(physicsWorld, entity, type);
            return () => {
                removeComponent(entity, getTagComponentForRigidBody(type));
            };
        }, [physicsWorld, component.type]);

        useEffect(() => {
            if (!physicsWorld) return;
            Physics.enabledCcd(physicsWorld, entity, component.ccd.value);
        }, [physicsWorld, component.ccd]);

        useEffect(() => {
            if (!physicsWorld) return;
            const value = component.allowRolling.value;
            /**
             * @todo Change this back to `Physics.lockRotations( entity, !value )` when we update to Rapier >= 0.12.0
             * https://github.com/dimforge/rapier.js/issues/282  */
            Physics.setEnabledRotations(physicsWorld, entity, [value, value, value]);
        }, [component.allowRolling.value]);

        useEffect(() => {
            if (!physicsWorld) return;
            Physics.setEnabledRotations(physicsWorld, entity, component.enabledRotations.value);
        }, [
            component.enabledRotations[0].value,
            component.enabledRotations[1].value,
            component.enabledRotations[2].value,
        ]);

        return null;
    },
});

export const RigidBodyDynamicTagComponent = defineComponent({
    name: "RigidBodyDynamicTagComponent",
});
export const RigidBodyFixedTagComponent = defineComponent({ name: "RigidBodyFixedTagComponent" });
export const RigidBodyKinematicTagComponent = defineComponent({
    name: "RigidBodyKinematicTagComponent",
});

export const getTagComponentForRigidBody = type => {
    switch (type) {
        case BodyTypes.Dynamic:
            return RigidBodyDynamicTagComponent;
        case BodyTypes.Fixed:
            return RigidBodyFixedTagComponent;
        case BodyTypes.Kinematic:
            return RigidBodyKinematicTagComponent;
    }
};
