import i18n from "i18next";

import { createScene } from "../../../client-core/src/world/SceneAPI";
import multiLogger from "../../../common/src/logger";
import { cleanString } from "../../../common/src/utils/cleanString";
import { UUIDComponent, UndefinedEntity } from "../../../ecs";
import { getComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { GLTFComponent } from "../../../engine/gltf/GLTFComponent";
import { GLTFDocumentState } from "../../../engine/gltf/GLTFDocumentState";
import { GLTFSourceState } from "../../../engine/gltf/GLTFState";
import { getMutableState, getState } from "../../../hyperflux";
import { EngineState } from "../../../spatial/EngineState";
import { SceneComponent } from "../../../spatial/renderer/components/SceneComponents";
import { EditorState } from "../services/EditorServices";

const logger = multiLogger.child({ component: "editor:sceneFunctions" });

const fileServer = `${process.env.REACT_APP_S3_ASSETS}/editor`;

export const saveSceneGLTF = async (_sceneAssetID, projectName, sceneFile, signal, saveAs) => {
    if (signal.aborted) throw new Error(i18n.t("editor:errors.saveProjectAborted"));

    const { rootEntity } = getState(EditorState);
    const sourceID = `${getComponent(rootEntity, UUIDComponent)}-${getComponent(rootEntity, GLTFComponent).src}`;

    const sceneName = cleanString(sceneFile?.replace(".scene.json", "").replace(".gltf", ""));
    // const currentSceneDirectory = getState(EditorState)
    //     .scenePath?.split("/")
    //     .slice(0, -1)
    //     .join("/");

    if (saveAs) {
        // const existingScene = await API.instance.service(staticResourcePath).find({
        //     query: { key: `${currentSceneDirectory}/${sceneName}.gltf`, $limit: 1 },
        // });
        // if (existingScene.data.length > 0)
        //     throw new Error(i18n.t("editor:errors.sceneAlreadyExists"));
    }

    const gltfData = getState(GLTFDocumentState)[sourceID];
    if (!gltfData) {
        console.error("Failed to save scene, no gltf data found");
    }
    // const encodedGLTF = handleScenePaths(gltfData, "encode");
    // const blob = [JSON.stringify(encodedGLTF, null, 2)];
    // const file = new File(blob, `${sceneName}.gltf`);

    // const currentScene = await API.instance.service(staticResourcePath).get(sceneAssetID);

    // const [[newPath]] = await Promise.all(
    //     uploadProjectFiles(
    //         projectName,
    //         [file],
    //         [currentSceneDirectory],
    //         [
    //             {
    //                 type: "scene",
    //                 contentType: "model/gltf+json",
    //                 thumbnailKey: currentScene.thumbnailKey,
    //             },
    //         ],
    //     ).promises,
    // );

    const newURL = new URL(newPath);
    newURL.hash = "";
    newURL.search = "";
    const assetURL = newURL.href.replace(fileServer, "").slice(1); // remove leading slash

    // const result = await API.instance.service(staticResourcePath).find({
    //     query: { key: assetURL, $limit: 1 },
    // });

    // if (result.total !== 1) {
    //     throw new Error(i18n.t("editor:errors.sceneSaveFailed"));
    // }

    getMutableState(EditorState).merge({
        sceneName,
        scenePath: assetURL,
        projectName,
        sceneAssetID: result.data[0].id,
    });
};

export const onNewScene = async (
    templateURL = `${process.env.REACT_APP_S3_ASSETS}/editor` +
        "/projects/spark/default-project/public/scenes/default.gltf",
) => {
    const { projectName } = getState(EditorState);
    if (!projectName) return;

    try {
        const sceneData = await createScene(projectName, templateURL);
        if (!sceneData) return;
        const sceneName = sceneData.key.split("/").pop();

        getMutableState(EditorState).merge({
            sceneName,
            scenePath: sceneData.key,
            projectName: projectName,
            sceneAssetID: sceneData.id,
        });
    } catch (error) {
        console.error(error);
    }
};

export const setCurrentEditorScene = (sceneURL, uuid) => {
    const gltfEntity = GLTFSourceState.load(sceneURL, uuid, getState(EngineState).originEntity);
    setComponent(gltfEntity, SceneComponent);
    getMutableState(EditorState).rootEntity.set(gltfEntity);
    return () => {
        getMutableState(EditorState).rootEntity.set(UndefinedEntity);
        GLTFSourceState.unload(gltfEntity);
    };
};
