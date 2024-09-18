import { useLayoutEffect } from "react";
import ECS, {
    defineComponent,
    defineQuery,
    Engine,
    getComponent,
    hasComponent,
    removeComponent,
    setComponent,
    UndefinedEntity,
    useComponent,
    useEntityContext,
} from "../../ecs";
import { matches } from "../../hyperflux";

/** ID of last network created. */
let availableNetworkId = 0;

export const NetworkObjectComponent = defineComponent({
    name: "NetworkObjectComponent",

    schema: {
        networkId: ECS.Types.ui32,
    },

    onInit: _entity => {
        return {
            /** The user who is authority over this object. */
            ownerId: "",
            ownerPeer: "",
            /** The peer who is authority over this object. */
            authorityPeerID: "",
            /** The network id for this object (this id is only unique per owner) */
            networkId: 0,
        };
    },

    toJSON: (_entity, component) => {
        return {
            ownerId: component.ownerId.value,
            ownerPeer: component.ownerPeer.value,
            authorityPeerID: component.authorityPeerID.value,
            networkId: component.networkId.value,
        };
    },

    onSet: (entity, component, json) => {
        if (typeof json?.ownerId === "string") component.ownerId.set(json.ownerId);
        if (typeof json?.ownerPeer === "string") component.ownerPeer.set(json.ownerPeer);
        if (typeof json?.authorityPeerID === "string")
            component.authorityPeerID.set(json.authorityPeerID);
        if (typeof json?.networkId === "number") {
            component.networkId.set(json.networkId);
            NetworkObjectComponent.networkId[entity] = json.networkId;
        }
    },

    reactor: function () {
        const entity = useEntityContext();
        const networkObject = useComponent(entity, NetworkObjectComponent);

        useLayoutEffect(() => {
            if (networkObject.authorityPeerID.value === Engine.instance.store.peerID)
                setComponent(entity, NetworkObjectAuthorityTag);
            else removeComponent(entity, NetworkObjectAuthorityTag);
        }, [networkObject.authorityPeerID]);

        useLayoutEffect(() => {
            if (networkObject.ownerId.value === Engine.instance.userID)
                setComponent(entity, NetworkObjectOwnedTag);
            else removeComponent(entity, NetworkObjectOwnedTag);
        }, [networkObject.ownerId]);

        return null;
    },

    /**
     * Get the network objects owned by a given user
     * @param ownerId
     */
    getOwnedNetworkObjects(ownerId) {
        return networkObjectQuery().filter(
            eid => getComponent(eid, NetworkObjectComponent).ownerId === ownerId,
        );
    },

    /**
     * Get a network object by ownerPeer and NetworkId
     * @returns
     */
    getNetworkObject(ownerPeer, networkId) {
        return (
            networkObjectQuery().find(eid => {
                const networkObject = getComponent(eid, NetworkObjectComponent);
                return (
                    networkObject.networkId === networkId && networkObject.ownerPeer === ownerPeer
                );
            }) || UndefinedEntity
        );
    },

    /**
     * Get the user entity that has a specific component
     * @param userId
     * @param component
     * @returns
     */
    getOwnedNetworkObjectWithComponent(userId, component) {
        return (
            NetworkObjectComponent.getOwnedNetworkObjects(userId).find(eid => {
                return hasComponent(eid, component);
            }) || UndefinedEntity
        );
    },

    /**
     * Get the user entity that has a specific component
     * @param userId
     * @param component
     * @returns
     */
    getOwnedNetworkObjectsWithComponent(userId, component) {
        return NetworkObjectComponent.getOwnedNetworkObjects(userId).filter(eid => {
            return hasComponent(eid, component);
        });
    },

    /** Get next network id. */
    createNetworkId() {
        return ++availableNetworkId;
    },
});

/**
 * Network object query
 */
const networkObjectQuery = defineQuery([NetworkObjectComponent]);

/**
 * Authority is peer-specific.
 * Ownership is user-specific.
 * An object is owned by one user, having multiple representations across peers as entities, of which only one is the authority.
 * Authority can be transferred to other peer, including those operated by different users.
 */
export const NetworkObjectAuthorityTag = defineComponent({ name: "NetworkObjectAuthorityTag" });

export const NetworkObjectOwnedTag = defineComponent({ name: "NetworkObjectOwnedTag" });

export const NetworkObjectSendPeriodicUpdatesTag = defineComponent({
    name: "NetworkObjectSendPeriodicUpdatesTag",
});

export const matchesNetworkId = matches.number;
