import { Button, TextField } from "@mui/material";
import React, { useEffect } from "react";
import { Quaternion, Scene, Vector3 } from "three";
import { listResources, updateResource } from "../../../apis/projects";
import { pathJoin } from "../../../common/src/utils/miscUtils";
import { createEntity, entityExists, getComponent, removeEntity, setComponent } from "../../../ecs";
import { GLTFDocumentState } from "../../../engine/gltf/GLTFDocumentState";
import { ModelComponent } from "../../../engine/scene/components/ModelComponent";
import { SourceComponent } from "../../../engine/scene/components/SourceComponent";
import { proxifyParentChildRelationships } from "../../../engine/scene/functions/loadGLTFModel";
import { getMutableState, getState, startReactor, useHookstate } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { NameComponent } from "../../../spatial/common/NameComponent";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import Modal from "../../Modal";
import { EditorControlFunctions } from "../functions/EditorControlFunctions";
import { exportRelativeGLTF } from "../functions/exportGLTF";
import { EditorState } from "../services/EditorServices";
import { PopoverState } from "../services/PopoverState";
import { SelectionState } from "../services/SelectionServices";

export default function CreatePrefabPanel({ entity }) {
    const defaultPrefabFolder = useHookstate("assets/custom-prefabs");
    const prefabName = useHookstate("prefab");
    const prefabTag = useHookstate([]);

    const onExportPrefab = async () => {
        const editorState = getState(EditorState);
        const fileName = defaultPrefabFolder.value + "/" + prefabName.value + ".gltf";
        const srcProject = editorState.projectName;
        const fileURL = pathJoin(
            process.env.REACT_APP_S3_ASSETS,
            "editor",
            "projects",
            srcProject,
            fileName,
        );
        try {
            const parentEntity = getComponent(entity, EntityTreeComponent).parentEntity;
            const prefabEntity = createEntity();
            const obj = new Scene();
            addObjectToGroup(prefabEntity, obj);
            proxifyParentChildRelationships(obj);
            setComponent(prefabEntity, EntityTreeComponent, { parentEntity });
            setComponent(prefabEntity, NameComponent, prefabName.value);
            const entityTransform = getComponent(entity, TransformComponent);
            const position = entityTransform.position.clone();
            const rotation = entityTransform.rotation.clone();
            const scale = entityTransform.scale.clone();
            setComponent(prefabEntity, TransformComponent, {
                position,
                rotation,
                scale,
            });
            setComponent(entity, TransformComponent, {
                position: new Vector3(0, 0, 0),
                rotation: new Quaternion().identity(),
                scale: new Vector3(1, 1, 1),
            });
            setComponent(entity, EntityTreeComponent, { parentEntity: prefabEntity });
            getMutableState(SelectionState).selectedEntities.set([]);
            await exportRelativeGLTF(prefabEntity, srcProject, fileName);

            const resources = await listResources({
                filters: { query: { key: "projects/" + "default-project" + "/" + fileName } },
            });
            if (resources.data.length === 0) {
                throw new Error("User not found");
            }
            const resource = resources.data[0];
            const tags = [...prefabTag.value];
            await updateResource(resource.id, { tags: tags, projectName: srcProject });

            removeEntity(prefabEntity);
            EditorControlFunctions.removeObject([entity]);
            const sceneID = getComponent(parentEntity, SourceComponent);
            const reactor = startReactor(() => {
                const documentState = useHookstate(getMutableState(GLTFDocumentState));
                const nodes = documentState[sceneID].nodes;
                useEffect(() => {
                    if (!entityExists(entity)) {
                        const { entityUUID } = EditorControlFunctions.createObjectFromSceneElement(
                            [
                                { name: ModelComponent.jsonID, props: { src: fileURL } },
                                {
                                    name: TransformComponent.jsonID,
                                    props: { position, rotation, scale },
                                },
                            ],
                            parentEntity,
                        );
                        getMutableState(SelectionState).selectedEntities.set([entityUUID]);
                        reactor.stop();
                    } else {
                        console.log("Entity not removed");
                    }
                }, [nodes]);
                return null;
            });
            PopoverState.hidePopupover();
            defaultPrefabFolder.set("assets/custom-prefabs");
            prefabName.set("prefab");
            prefabTag.set([]);
        } catch (e) {
            console.error(e);
        }
    };
    return (
        <Modal
            heading="Create Prefab"
            open={true}
            className="w-[50vw] max-w-2xl"
            onClose={PopoverState.hidePopupover}
        >
            <TextField
                value={defaultPrefabFolder.value}
                onChange={event => defaultPrefabFolder.set(event.target.value)}
                label="Default Save Folder"
            />
            <TextField
                value={prefabName.value}
                onChange={event => prefabName.set(event.target.value)}
                label="Name"
            />

            <Button
                size="small"
                variant="outline"
                onClick={() => {
                    prefabTag.set([...(prefabTag.value ?? []), ""]);
                }}
            >
                {"Add New Tag"}
            </Button>
            <div>
                {(prefabTag.value ?? []).map((tag, index) => (
                    <div
                        style={{ display: "flex", flexDirection: "row", margin: "0, 16px 0 0" }}
                        key={`prefab-tag-${index}`}
                    >
                        <TextField
                            key={index}
                            label={"Tag"}
                            onChange={event => {
                                const tags = [...prefabTag.value];
                                tags[index] = event.target.value;
                                prefabTag.set(tags);
                            }}
                            value={prefabTag.value[index]}
                        />
                        <Button
                            onClick={() => {
                                prefabTag.set(prefabTag.value.filter((_, i) => i !== index));
                            }}
                            size="small"
                            variant="outline"
                            sx={{
                                mt: "6px",
                                maxHeight: "20px",
                            }}
                        >
                            {" "}
                            x{" "}
                        </Button>
                    </div>
                ))}
            </div>
            <Button onClick={onExportPrefab} color={"success"}>
                Submit
            </Button>
        </Modal>
    );
}
