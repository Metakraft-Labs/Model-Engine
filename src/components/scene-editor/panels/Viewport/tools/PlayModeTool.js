import { Tooltip } from "@mui/material";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlinePause, HiOutlinePlay } from "react-icons/hi2";
import { UserStore } from "../../../../../contexts/UserStore";
import { UUIDComponent } from "../../../../../ecs";
import { getComponent, removeComponent } from "../../../../../ecs/ComponentFunctions";
import { Engine } from "../../../../../ecs/Engine";
import { removeEntity } from "../../../../../ecs/EntityFunctions";
import { VisualScriptActions, visualScriptQuery } from "../../../../../engine";
import { AvatarComponent } from "../../../../../engine/avatar/components/AvatarComponent";
import { getRandomSpawnPoint } from "../../../../../engine/avatar/functions/getSpawnPoint";
import { spawnLocalAvatarInWorld } from "../../../../../engine/avatar/functions/receiveJoinWorld";
import { dispatchAction, getMutableState, getState, useHookstate } from "../../../../../hyperflux";
import { WorldNetworkAction } from "../../../../../network";
import { EngineState } from "../../../../../spatial/EngineState";
import { FollowCameraComponent } from "../../../../../spatial/camera/components/FollowCameraComponent";
import { TargetCameraRotationComponent } from "../../../../../spatial/camera/components/TargetCameraRotationComponent";
import { ComputedTransformComponent } from "../../../../../spatial/transform/components/ComputedTransformComponent";
import Button from "../../../../Button";
import { TransformGizmoControlledComponent } from "../../../classes/TransformGizmoControlledComponent";
import { EditorState } from "../../../services/EditorServices";
import { transformGizmoControlledQuery } from "../../../systems/GizmoSystem";

const PlayModeTool = () => {
    const { t } = useTranslation();

    const isEditing = useHookstate(getMutableState(EngineState).isEditing);
    const { user } = useContext(UserStore);

    const onTogglePlayMode = () => {
        const entity = AvatarComponent.getSelfAvatarEntity();
        if (entity) {
            dispatchAction(
                WorldNetworkAction.destroyEntity({
                    entityUUID: getComponent(entity, UUIDComponent),
                }),
            );
            removeEntity(entity);
            removeComponent(Engine.instance.cameraEntity, ComputedTransformComponent);
            removeComponent(Engine.instance.cameraEntity, FollowCameraComponent);
            removeComponent(Engine.instance.cameraEntity, TargetCameraRotationComponent);
            getMutableState(EngineState).isEditing.set(true);
            visualScriptQuery().forEach(entity =>
                dispatchAction(VisualScriptActions.stop({ entity })),
            );
            // stop all visual script logic
        } else {
            const avatarDetails = user.image;

            const avatarSpawnPose = getRandomSpawnPoint(Engine.instance.userID);
            const currentScene = getComponent(getState(EditorState).rootEntity, UUIDComponent);

            if (avatarDetails)
                spawnLocalAvatarInWorld({
                    parentUUID: currentScene,
                    avatarSpawnPose,
                    avatarID: avatarDetails.id,
                    name: user.name,
                });

            // todo
            getMutableState(EngineState).isEditing.set(false);
            // run all visual script logic
            visualScriptQuery().forEach(entity =>
                dispatchAction(VisualScriptActions.execute({ entity })),
            );
            transformGizmoControlledQuery().forEach(entity =>
                removeComponent(entity, TransformGizmoControlledComponent),
            );
            //just remove all gizmo in the scene
        }
    };

    return (
        <div id="preview" className="flex items-center">
            <Tooltip
                title={
                    isEditing.value
                        ? t("editor:toolbar.command.lbl-playPreview")
                        : t("editor:toolbar.command.lbl-stopPreview")
                }
                content={
                    isEditing.value
                        ? t("editor:toolbar.command.info-playPreview")
                        : t("editor:toolbar.command.info-stopPreview")
                }
            >
                <Button
                    variant="transparent"
                    startIcon={
                        isEditing.value ? (
                            <HiOutlinePlay className="text-theme-input" />
                        ) : (
                            <HiOutlinePause className="text-theme-input" />
                        )
                    }
                    className="p-0"
                    onClick={onTogglePlayMode}
                />
            </Tooltip>
        </div>
    );
};

export default PlayModeTool;
