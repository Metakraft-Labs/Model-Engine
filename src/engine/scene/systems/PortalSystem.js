import { useEffect } from "react";

import { UUIDComponent } from "../../../ecs";
import { getComponent, getMutableComponent } from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../../ecs/SystemGroups";
import { getMutableState, getState, useHookstate } from "../../../hyperflux";
import { SpawnPoseState } from "../../../spatial";
import { FollowCameraMode } from "../../../spatial/camera/types/FollowCameraMode";

import { FollowCameraComponent } from "../../../spatial/camera/components/FollowCameraComponent";
import { AvatarComponent } from "../../avatar/components/AvatarComponent";
import { AvatarControllerComponent } from "../../avatar/components/AvatarControllerComponent";
import { PortalComponent, PortalState } from "../components/PortalComponent";

const reactor = () => {
    const activePortalEntityState = useHookstate(getMutableState(PortalState).activePortalEntity);

    useEffect(() => {
        const activePortalEntity = activePortalEntityState.value;
        if (!activePortalEntity) return;
        const activePortal = getComponent(activePortalEntity, PortalComponent);
        getMutableComponent(Engine.instance.cameraEntity, FollowCameraComponent).mode.set(
            FollowCameraMode.ShoulderCam,
        );
        const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();
        AvatarControllerComponent.captureMovement(selfAvatarEntity, activePortalEntity);

        return () => {
            const selfAvatarEntity = AvatarComponent.getSelfAvatarEntity();
            getState(SpawnPoseState)[
                getComponent(selfAvatarEntity, UUIDComponent)
            ].spawnPosition.copy(activePortal.remoteSpawnPosition);
            AvatarControllerComponent.releaseMovement(selfAvatarEntity, activePortalEntity);
            getMutableState(PortalState).lastPortalTimeout.set(Date.now());
        };
    }, [activePortalEntityState]);

    return null;
};

export const PortalSystem = defineSystem({
    uuid: "ee.engine.PortalSystem",
    insert: { after: PresentationSystemGroup },
    reactor,
});
