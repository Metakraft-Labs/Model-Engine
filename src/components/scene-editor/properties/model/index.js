import { VRM } from "@pixiv/three-vrm";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineViewInAr } from "react-icons/md";

import { FeatureFlags } from "../../../../common/src/constants/FeatureFlags";
import { STATIC_ASSET_REGEX } from "../../../../common/src/regex";
import { pathJoin } from "../../../../common/src/utils/miscUtils";
import { useComponent } from "../../../../ecs/ComponentFunctions";
import { ResourceLoaderManager } from "../../../../engine/assets/functions/resourceLoaderFunctions";
import { recursiveHipsLookup } from "../../../../engine/avatar/AvatarBoneMatching";
import { getEntityErrors } from "../../../../engine/scene/components/ErrorComponent";
import { ModelComponent } from "../../../../engine/scene/components/ModelComponent";
import useFeatureFlags from "../../../../engine/useFeatureFlags";
import { getState, useState } from "../../../../hyperflux";
import BooleanInput from "../../../Boolean";
import Button from "../../../Button";
import InputGroup from "../../../Group";
import ModelInput from "../../../inputs/Model";
import StringInput from "../../../inputs/String";
import ErrorPopUp from "../../../Popup/Popup2/ErrorPopUp";
import SelectInput from "../../../Select";
import { exportRelativeGLTF } from "../../functions/exportGLTF";
import { EditorState } from "../../services/EditorServices";
import { ProjectState } from "../../services/ProjectService";
import NodeEditor from "../nodeEditor";
import ScreenshareTargetNodeEditor from "../screenShareTarget";
import { commitProperty } from "../Util";
import ModelTransformProperties from "./transform";

/**
 * ModelNodeEditor used to create editor view for the properties of ModelNode.
 *
 * @type {class component}
 */
export const ModelNodeEditor = props => {
    const { t } = useTranslation();
    const entity = props.entity;
    const modelComponent = useComponent(entity, ModelComponent);
    const exporting = useState(false);
    const bonematchable = useState(false);
    const editorState = getState(EditorState);
    const projectState = getState(ProjectState);
    const loadedProjects = useState(() => projectState.projects.map(project => project.name));
    const srcProject = useState(() => {
        const match = STATIC_ASSET_REGEX.exec(
            modelComponent.src.value?.replace("projects/spark", "projects"),
        );
        if (!match?.length) return editorState.projectName;
        const [_, orgName, projectName] = match;
        return `${orgName}/${projectName}`;
    });

    const [dereferenceFeatureFlag, gltfTransformFeatureFlag] = useFeatureFlags([
        FeatureFlags.Studio.Model.Dereference,
        FeatureFlags.Studio.Model.GLTFTransform,
    ]);

    const getRelativePath = useCallback(() => {
        const relativePath = STATIC_ASSET_REGEX.exec(
            modelComponent.src.value?.replace("projects/spark", "projects"),
        )?.[2];
        if (!relativePath) {
            return "assets/new-model";
        } else {
            //return relativePath without file extension
            return relativePath.replace(/\.[^.]*$/, "");
        }
    }, [modelComponent.src]);

    const getExportExtension = useCallback(() => {
        if (!modelComponent.src.value) return "gltf";
        else
            return modelComponent.src.value?.replace("projects/spark", "projects").endsWith(".gltf")
                ? "gltf"
                : "glb";
    }, [modelComponent.src]);

    const srcPath = useState(getRelativePath());

    const exportType = useState(getExportExtension());

    const errors = getEntityErrors(props.entity, ModelComponent);

    const onExportModel = () => {
        if (exporting.value) {
            console.warn("already exporting");
            return;
        }
        exporting.set(true);
        const fileName = `${srcPath.value}.${exportType.value}`;
        exportRelativeGLTF(entity, srcProject.value, fileName).then(() => {
            const nuPath = pathJoin(
                `${process.env.REACT_APP_S3_ASSETS}/editor`,
                "projects",
                srcProject.value,
                fileName,
            );
            commitProperty(ModelComponent, "src")(nuPath);
            ResourceLoaderManager.updateResource(nuPath);
            exporting.set(false);
        });
    };

    useEffect(() => {
        srcPath.set(getRelativePath());
        exportType.set(getExportExtension());
    }, [modelComponent.src]);

    useEffect(() => {
        if (!modelComponent.asset.value) return;
        bonematchable.set(
            modelComponent.asset.value &&
                (modelComponent.asset.value instanceof VRM ||
                    recursiveHipsLookup(modelComponent.asset.value.scene)),
        );
    }, [modelComponent.asset]);

    return (
        <NodeEditor
            name={t("editor:properties.model.title")}
            description={t("editor:properties.model.description")}
            icon={<ModelNodeEditor.iconComponent />}
            {...props}
        >
            <InputGroup name="Model Url" label={t("editor:properties.model.lbl-modelurl")}>
                <ModelInput
                    value={modelComponent.src.value?.replace("projects/spark", "projects")}
                    onRelease={src => {
                        if (
                            src?.replace("projects/spark", "projects") !==
                            modelComponent.src.value?.replace("projects/spark", "projects")
                        )
                            commitProperty(
                                ModelComponent,
                                "src",
                            )(src?.replace("projects/spark", "projects"));
                        else
                            ResourceLoaderManager.updateResource(
                                src?.replace("projects/spark", "projects"),
                            );
                    }}
                />
                {errors?.LOADING_ERROR ||
                    (errors?.INVALID_SOURCE &&
                        ErrorPopUp({ message: t("editor:properties.model.error-url") }))}
            </InputGroup>
            {dereferenceFeatureFlag && (
                <Button
                    className="self-end"
                    onClick={() => modelComponent.dereference.set(true)}
                    disabled={!modelComponent.src.value?.replace("projects/spark", "projects")}
                >
                    Dereference
                </Button>
            )}
            <InputGroup
                name="Camera Occlusion"
                label={t("editor:properties.model.lbl-cameraOcclusion")}
            >
                <BooleanInput
                    value={modelComponent.cameraOcclusion.value}
                    onChange={commitProperty(ModelComponent, "cameraOcclusion")}
                />
            </InputGroup>
            {bonematchable.value && (
                <InputGroup name="Force VRM" label={t("editor:properties.model.lbl-convertToVRM")}>
                    <BooleanInput
                        value={modelComponent.convertToVRM.value}
                        onChange={commitProperty(ModelComponent, "convertToVRM")}
                    />
                </InputGroup>
            )}
            {!exporting.value && (
                <div className="m-2 flex flex-col rounded-md p-1">
                    <div className="property-group-header">
                        {t("editor:properties.model.lbl-export")}
                    </div>
                    <InputGroup name="Export Project" label="Project">
                        <SelectInput
                            value={srcProject.value}
                            options={
                                loadedProjects.value.map(project => ({
                                    label: project,
                                    value: project,
                                })) ?? []
                            }
                            onChange={val => srcProject.set(val)}
                        />
                    </InputGroup>
                    <InputGroup name="File Path" label="File Path">
                        <StringInput value={srcPath.value} onChange={srcPath.set} />
                    </InputGroup>
                    <InputGroup
                        name="Export Type"
                        label={t("editor:properties.model.lbl-exportType")}
                    >
                        <SelectInput
                            options={[
                                {
                                    label: "glB",
                                    value: "glb",
                                },
                                {
                                    label: "glTF",
                                    value: "gltf",
                                },
                            ]}
                            value={exportType.value}
                            onChange={val => exportType.set(val)}
                        />
                    </InputGroup>
                    <Button className="self-end" onClick={onExportModel}>
                        {t("editor:properties.model.saveChanges")}
                    </Button>
                </div>
            )}
            {exporting.value && <p>Exporting...</p>}
            <ScreenshareTargetNodeEditor entity={props.entity} multiEdit={props.multiEdit} />
            {gltfTransformFeatureFlag && (
                <ModelTransformProperties
                    entity={entity}
                    onChangeModel={commitProperty(ModelComponent, "src")}
                />
            )}
        </NodeEditor>
    );
};

ModelNodeEditor.iconComponent = MdOutlineViewInAr;

export default ModelNodeEditor;
