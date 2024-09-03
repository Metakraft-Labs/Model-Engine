import { Engine, matchesEntityUUID } from "../../../ecs";
import { defineAction, matchesPeerID, matchesWithDefault } from "../../../hyperflux";
import { NetworkTopics } from "../Network";
import { matchesNetworkId, NetworkObjectComponent } from "../NetworkObjectComponent";
import { matchesUserID } from "./matchesUserID";

export class WorldNetworkAction {
    static spawnEntity = defineAction({
        type: "ee.network.SPAWN_ENTITY",
        entityUUID: matchesEntityUUID,
        parentUUID: matchesEntityUUID,
        networkId: matchesWithDefault(matchesNetworkId, () =>
            NetworkObjectComponent.createNetworkId(),
        ),
        ownerID: matchesWithDefault(matchesUserID, () => Engine.instance.userID),
        authorityPeerId: matchesPeerID.optional(),
        $cache: true,
        $topic: NetworkTopics.world,
    });

    static destroyEntity = defineAction({
        type: "ee.network.DESTROY_ENTITY",
        entityUUID: matchesEntityUUID,
        $cache: true,
        $topic: NetworkTopics.world,
    });

    static requestAuthorityOverObject = defineAction({
        /** @todo embed $to restriction */
        type: "ee.engine.world.REQUEST_AUTHORITY_OVER_ENTITY",
        entityUUID: matchesEntityUUID,
        newAuthority: matchesPeerID,
        $topic: NetworkTopics.world,
    });

    static transferAuthorityOfObject = defineAction({
        type: "ee.engine.world.TRANSFER_AUTHORITY_OF_ENTITY",
        ownerID: matchesUserID,
        entityUUID: matchesEntityUUID,
        newAuthority: matchesPeerID,
        $topic: NetworkTopics.world,
        $cache: true,
    });
}
