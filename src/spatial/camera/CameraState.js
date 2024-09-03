import { defineAction, defineState, matches } from "../../hyperflux";
import { SpawnObjectActions } from "../transform/SpawnObjectActions";

export const CameraSettings = defineState({
    name: "xre.engine.CameraSettings",
    initial: () => ({
        cameraRotationSpeed: 200,
    }),
});

export class CameraActions {
    static spawnCamera = defineAction(
        SpawnObjectActions.spawnObject.extend({
            type: "ee.engine.world.SPAWN_CAMERA",
        }),
    );

    static fadeToBlack = defineAction({
        type: "xre.engine.CameraActions.FadeToBlack",
        in: matches.boolean,
    });
}
