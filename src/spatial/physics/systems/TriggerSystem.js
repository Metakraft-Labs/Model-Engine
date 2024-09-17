import { UUIDComponent } from "../../../ecs";
import { getComponent, getOptionalComponent } from "../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { CallbackComponent } from "../../../spatial/common/CallbackComponent";
import { CollisionComponent } from "../../../spatial/physics/components/CollisionComponent";
import { PhysicsSystem } from "../../../spatial/physics/systems/PhysicsSystem";
import { CollisionEvents } from "../../../spatial/physics/types/PhysicsTypes";

import { TriggerComponent } from "../components/TriggerComponent";

export const triggerEnter = (triggerEntity, otherEntity, _hit) => {
    const triggerComponent = getComponent(triggerEntity, TriggerComponent);
    for (const trigger of triggerComponent.triggers) {
        if (trigger.target && !UUIDComponent.getEntityByUUID(trigger.target)) continue;
        const targetEntity = trigger.target
            ? UUIDComponent.getEntityByUUID(trigger.target)
            : triggerEntity;
        if (targetEntity && trigger.onEnter) {
            const callbacks = getOptionalComponent(targetEntity, CallbackComponent);
            if (!callbacks) continue;
            callbacks.get(trigger.onEnter)?.(triggerEntity, otherEntity);
        }
    }
};

export const triggerExit = (triggerEntity, otherEntity, _hit) => {
    const triggerComponent = getComponent(triggerEntity, TriggerComponent);
    for (const trigger of triggerComponent.triggers) {
        if (trigger.target && !UUIDComponent.getEntityByUUID(trigger.target)) continue;
        const targetEntity = trigger.target
            ? UUIDComponent.getEntityByUUID(trigger.target)
            : triggerEntity;
        if (targetEntity && trigger.onExit) {
            const callbacks = getOptionalComponent(targetEntity, CallbackComponent);
            if (!callbacks) continue;
            callbacks.get(trigger.onExit)?.(triggerEntity, otherEntity);
        }
    }
};

const collisionQuery = defineQuery([TriggerComponent, CollisionComponent]);

const execute = () => {
    for (const entity of collisionQuery()) {
        for (const [e, hit] of getComponent(entity, CollisionComponent)) {
            if (hit.type === CollisionEvents.TRIGGER_START) {
                triggerEnter(entity, e, hit);
            }
            if (hit.type === CollisionEvents.TRIGGER_END) {
                triggerExit(entity, e, hit);
            }
        }
    }
};

export const TriggerSystem = defineSystem({
    uuid: "ee.engine.TriggerSystem",
    insert: { with: PhysicsSystem },
    execute,
});
