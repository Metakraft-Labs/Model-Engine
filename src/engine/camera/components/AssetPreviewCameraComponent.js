import { useEffect } from "react";

import {
    defineComponent,
    matchesEntity,
    UndefinedEntity,
    useComponent,
    useEntityContext,
} from "../../../ecs";
import { CameraOrbitComponent } from "../../../spatial/camera/components/CameraOrbitComponent";

import { ModelComponent } from "../../scene/components/ModelComponent";

export const AssetPreviewCameraComponent = defineComponent({
    name: "AssetPreviewCameraComponent",

    onInit: _entity => {
        return { targetModelEntity: UndefinedEntity };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (matchesEntity.test(json.targetModelEntity))
            component.targetModelEntity.set(json.targetModelEntity);
    },

    reactor: () => {
        const entity = useEntityContext();
        const previewCameraComponent = useComponent(entity, AssetPreviewCameraComponent);
        const modelComponent = useComponent(
            previewCameraComponent.targetModelEntity.value,
            ModelComponent,
        );
        const cameraOrbitComponent = useComponent(entity, CameraOrbitComponent);

        useEffect(() => {
            if (!modelComponent.scene.value) return;
            cameraOrbitComponent.focusedEntities.set([
                previewCameraComponent.targetModelEntity.value,
            ]);
            cameraOrbitComponent.refocus.set(true);
        }, [modelComponent.scene, cameraOrbitComponent]);

        return null;
    },
});
