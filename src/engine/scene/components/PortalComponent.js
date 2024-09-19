import { useEffect } from "react";
import {
    BackSide,
    Euler,
    Mesh,
    MeshBasicMaterial,
    Quaternion,
    SphereGeometry,
    Vector3,
} from "three";

import { spawnPointPath } from "../../../common/src/schema.type.module";
import {
    defineComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../../ecs/Entity";
import { createEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { defineState, getMutableState, getState, matches, useHookstate } from "../../../hyperflux";
import { setCallback } from "../../../spatial/common/CallbackComponent";
import { Vector3_Right } from "../../../spatial/common/constants/MathConstants";
import { ArrowHelperComponent } from "../../../spatial/common/debug/ArrowHelperComponent";
import { useGet } from "../../../spatial/common/functions/FeathersHooks";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { TriggerComponent } from "../../../spatial/physics/components/TriggerComponent";
import { CollisionGroups } from "../../../spatial/physics/enums/CollisionGroups";
import { Shapes } from "../../../spatial/physics/types/PhysicsTypes";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { enableObjectLayer } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import { AvatarComponent } from "../../avatar/components/AvatarComponent";

export const PortalPreviewTypeSimple = "Simple";
export const PortalPreviewTypeSpherical = "Spherical";

export const PortalPreviewTypes = new Set();
PortalPreviewTypes.add(PortalPreviewTypeSimple);
PortalPreviewTypes.add(PortalPreviewTypeSpherical);

export const PortalEffects = new Map();
PortalEffects.set("None", null);

export const PortalState = defineState({
    name: "PortalState",
    initial: {
        lastPortalTimeout: 0,
        portalTimeoutDuration: 5000,
        activePortalEntity: UndefinedEntity,
        portalReady: false,
    },
});

export const PortalComponent = defineComponent({
    name: "PortalComponent",
    jsonID: "EE_portal",

    onInit: entity => {
        return {
            linkedPortalId: "",
            location: "",
            effectType: "None",
            previewType: PortalPreviewTypeSimple,
            previewImageURL: "",
            redirect: false,
            spawnPosition: new Vector3(),
            spawnRotation: new Quaternion(),
            remoteSpawnPosition: new Vector3(),
            remoteSpawnRotation: new Quaternion(),
            mesh: null,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        if (matches.string.test(json.linkedPortalId))
            component.linkedPortalId.set(json.linkedPortalId);
        if (matches.string.test(json.location)) component.location.set(json.location);
        if (matches.string.test(json.effectType)) component.effectType.set(json.effectType);
        if (matches.string.test(json.previewType)) component.previewType.set(json.previewType);
        if (matches.string.test(json.previewImageURL))
            component.previewImageURL.set(json.previewImageURL);
        if (matches.boolean.test(json.redirect)) component.redirect.set(json.redirect);
        if (matches.object.test(json.spawnPosition))
            component.spawnPosition.value.copy(json.spawnPosition);
        if (matches.object.test(json.spawnRotation)) {
            if (json.spawnRotation.w) component.spawnRotation.value.copy(json.spawnRotation);
            // backwards compat
            else
                component.spawnRotation.value.copy(
                    new Quaternion().setFromEuler(new Euler().setFromVector3(json.spawnRotation)),
                );
        }
    },

    toJSON: (entity, component) => {
        return {
            location: component.location.value,
            linkedPortalId: component.linkedPortalId.value,
            redirect: component.redirect.value,
            effectType: component.effectType.value,
            previewType: component.previewType.value,
            previewImageURL: component.previewImageURL.value,
            spawnPosition: {
                x: component.spawnPosition.value.x,
                y: component.spawnPosition.value.y,
                z: component.spawnPosition.value.z,
            },
            spawnRotation: {
                x: component.spawnRotation.value.x,
                y: component.spawnRotation.value.y,
                z: component.spawnRotation.value.z,
                w: component.spawnRotation.value.w,
            },
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const portalComponent = useComponent(entity, PortalComponent);

        useEffect(() => {
            setCallback(entity, "teleport", (triggerEntity, otherEntity) => {
                if (otherEntity !== AvatarComponent.getSelfAvatarEntity()) return;
                const now = Date.now();
                const { lastPortalTimeout, portalTimeoutDuration, activePortalEntity } =
                    getState(PortalState);
                if (activePortalEntity || lastPortalTimeout + portalTimeoutDuration > now) return;
                getMutableState(PortalState).activePortalEntity.set(entity);
            });

            /** Allow scene data populating rigidbody component too */
            if (hasComponent(entity, RigidBodyComponent)) return;
            setComponent(entity, RigidBodyComponent, { type: "fixed" });
            setComponent(entity, ColliderComponent, {
                shape: Shapes.Sphere,
                collisionLayer: CollisionGroups.Trigger,
                collisionMask: CollisionGroups.Avatars,
            });
            setComponent(entity, TriggerComponent, {
                triggers: [
                    {
                        onEnter: "teleport",
                        onExit: null,
                        target: "",
                    },
                ],
            });
        }, []);

        useEffect(() => {
            if (debugEnabled.value) {
                setComponent(entity, ArrowHelperComponent, {
                    name: "portal-helper",
                    length: 1,
                    dir: Vector3_Right,
                    color: 0x000000,
                });
            }
            return () => {
                removeComponent(entity, ArrowHelperComponent);
            };
        }, [debugEnabled]);

        useEffect(() => {
            if (portalComponent.previewType.value !== PortalPreviewTypeSpherical) return;

            const portalMesh = new Mesh(
                new SphereGeometry(1, 32, 32),
                new MeshBasicMaterial({ side: BackSide }),
            );
            enableObjectLayer(portalMesh, ObjectLayers.Camera, true);
            portalComponent.mesh.set(portalMesh);
            addObjectToGroup(entity, portalMesh);

            return () => {
                removeObjectFromGroup(entity, portalMesh);
            };
        }, [portalComponent.previewType]);

        const portalDetails = useGet(spawnPointPath, portalComponent.linkedPortalId.value);

        const [texture] = useTexture(portalDetails.data?.previewImageURL || "", entity);

        useEffect(() => {
            if (!texture || !portalComponent.mesh.value) return;

            const material = portalComponent.mesh.value.material;
            material.map = texture;
            material.needsUpdate = true;
        }, [texture, portalComponent.mesh]);

        useEffect(() => {
            if (!portalDetails.data) return;
            portalComponent.remoteSpawnPosition.value.copy(portalDetails.data.position);
            portalComponent.remoteSpawnRotation.value.copy(portalDetails.data.rotation);
        }, [portalDetails]);

        return null;
    },

    setPlayerInPortalEffect: effectType => {
        const entity = createEntity();
        setComponent(entity, EntityTreeComponent);
        setComponent(entity, NameComponent, "portal-" + effectType);
        setComponent(entity, VisibleComponent);
        setComponent(entity, PortalEffects.get(effectType));
    },
});
