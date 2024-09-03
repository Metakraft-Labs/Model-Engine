import { useEffect } from "react";
import { toast } from "react-toastify";
import { getComponent } from "../../../ecs";
import { GLTFModifiedState } from "../../../engine/gltf/GLTFDocumentState";
import { LinkState } from "../../../engine/scene/components/LinkComponent";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { UndefinedEntity } from "../ecs/Entity";
import {
    defineState,
    getMutableState,
    getState,
    syncStateWithLocalStorage,
    useHookstate,
    useMutableState,
} from "../hyperflux";

export const EditorState = defineState({
    name: "EditorState",
    initial: () => ({
        projectName,
        sceneName,
        /** the url of the current scene file */
        scenePath,
        /** just used to store the id of the current scene asset */
        sceneAssetID,
        expandedNodes: {},
        lockPropertiesPanel: "",
        panelLayout: {},
        rootEntity: UndefinedEntity,
        uiEnabled: true,
        uiMode: UIMode.ADVANCED,
        uiAddons: {
            container: {},
            newScene: {},
        },
    }),
    useIsModified: () => {
        const rootEntity = useHookstate(getMutableState(EditorState).rootEntity).value;
        const modifiedState = useMutableState(GLTFModifiedState);
        if (!rootEntity) return false;
        return !!modifiedState[getComponent(rootEntity, SourceComponent)].value;
    },
    isModified: () => {
        const rootEntity = getState(EditorState).rootEntity;
        if (!rootEntity) return false;
        return !!getState(GLTFModifiedState)[getComponent(rootEntity, SourceComponent)];
    },
    extension: syncStateWithLocalStorage(["expandedNodes"]),
    reactor: () => {
        const linkState = useMutableState(LinkState);

        useEffect(() => {
            if (!linkState.location.value) return;
            toast.warning("Scene navigation is disabled in the studio");
            linkState.location.set(undefined);
        }, [linkState.location]);

        return null;
    },
});
