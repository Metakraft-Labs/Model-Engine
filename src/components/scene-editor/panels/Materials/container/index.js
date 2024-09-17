import React, { useEffect } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";

import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { HiFilter, HiGlobeAlt } from "react-icons/hi";
import { pathJoin } from "../../../../../common/src/utils/miscUtils";
import { getComponent, getOptionalComponent, useQuery, UUIDComponent } from "../../../../../ecs";
import exportMaterialsGLTF from "../../../../../engine/assets/functions/exportMaterialsGLTF";
import { SourceComponent } from "../../../../../engine/scene/components/SourceComponent";
import { getMaterialsFromScene } from "../../../../../engine/scene/materials/functions/materialSourcingFunctions";
import { MaterialSelectionState } from "../../../../../engine/scene/materials/MaterialLibraryState";
import {
    getMutableState,
    getState,
    useHookstate,
    useMutableState,
    useState,
} from "../../../../../hyperflux";
import { MaterialStateComponent } from "../../../../../spatial/renderer/materials/MaterialComponent";
import Button from "../../../../Button";
import InputGroup from "../../../../Group";
import { uploadProjectFiles } from "../../../functions/assetFunctions";
import { EditorState } from "../../../services/EditorServices";
import { ImportSettingsState } from "../../../services/ImportSettingsState";
import { SelectionState } from "../../../services/SelectionServices";
import { MaterialPreviewPanel } from "../../preview/material";
import MaterialLibraryEntry from "../node";

export default function MaterialLibraryPanel() {
    const { t } = useTranslation();
    const srcPath = useState("/mat/material-test");
    const materialPreviewPanelRef = React.useRef();

    const materialQuery = useQuery([MaterialStateComponent]);
    const nodes = useHookstate([]);
    const selected = useHookstate(getMutableState(SelectionState).selectedEntities);
    const selectedMaterial = useMutableState(MaterialSelectionState).selectedMaterial;
    const hasSelectedMaterial = useState(false);
    const useSelected = useState(false);

    useEffect(() => {
        const materials =
            selected.value.length && useSelected.value
                ? getMaterialsFromScene(UUIDComponent.getEntityByUUID(selected.value[0]))
                : materialQuery
                      .map(entity => getComponent(entity, UUIDComponent))
                      .filter(uuid => uuid !== MaterialStateComponent.fallbackMaterial);

        const materialsBySource = {};
        for (const uuid of materials) {
            const source =
                getOptionalComponent(UUIDComponent.getEntityByUUID(uuid), SourceComponent) ?? "";
            materialsBySource[source] = materialsBySource[source]
                ? [...materialsBySource[source], uuid]
                : [uuid];
        }
        const materialsBySourceArray = Object.entries(materialsBySource);
        const flattenedMaterials = materialsBySourceArray.reduce(
            (acc, [source, uuids]) => acc.concat([source], uuids),
            [],
        );
        nodes.set(flattenedMaterials);
    }, [materialQuery.length, selected, useSelected]);

    useEffect(() => {
        hasSelectedMaterial.set(selectedMaterial.value !== null);
    }, [selectedMaterial.value]);

    const onClick = (e, node) => {
        getMutableState(MaterialSelectionState).selectedMaterial.set(node);
    };

    const MaterialList = ({ height, width }) => (
        <FixedSizeList
            height={height - 32}
            width={width}
            itemSize={32}
            itemCount={nodes.length}
            itemData={{
                nodes: nodes.value,
                onClick,
            }}
            itemKey={(index, _) => index}
            innerElementType="ul"
        >
            {MaterialLibraryEntry}
        </FixedSizeList>
    );

    return (
        <div className="h-full overflow-scroll">
            <div className="w-full rounded-[5px] p-3">
                <div className="rounded-lg bg-zinc-800 p-2">
                    <MaterialPreviewPanel ref={materialPreviewPanelRef} />
                </div>
                <div className="mt-4 flex h-5 items-center gap-2">
                    <InputGroup name="File Path" label="Save to" className="flex-grow">
                        <TextField value={srcPath.value} onChange={srcPath.set} />
                    </InputGroup>
                    <Button
                        className="flex w-5 flex-grow items-center justify-center text-xs"
                        variant="outline"
                        onClick={async () => {
                            const projectName = getState(EditorState).projectName;
                            const materialUUID =
                                getState(MaterialSelectionState).selectedMaterial ?? "";
                            let libraryName = srcPath.value;
                            if (!libraryName.endsWith(".material.gltf")) {
                                libraryName += ".material.gltf";
                            }
                            const relativePath = pathJoin("assets", libraryName);
                            const gltf = await exportMaterialsGLTF(
                                [UUIDComponent.getEntityByUUID(materialUUID)],
                                {
                                    binary: false,
                                    relativePath,
                                },
                            );
                            const blob = [JSON.stringify(gltf)];
                            const file = new File(blob, libraryName);
                            const importSettings = getState(ImportSettingsState);
                            const urls = await Promise.all(
                                uploadProjectFiles(
                                    projectName,
                                    [file],
                                    [`projects/${projectName}${importSettings.importFolder}`],
                                ).promises,
                            );
                            const adjustedLibraryName =
                                libraryName.length > 0 ? libraryName.substring(1) : "";
                            const key = `projects/${projectName}${importSettings.importFolder}${adjustedLibraryName}`;
                            // const resources = await API.instance.service(staticResourcePath).find({
                            //     query: { key: key },
                            // });
                            // if (resources.data.length === 0) {
                            //     throw new Error("User not found");
                            // }
                            // const resource = resources.data[0];
                            // const tags = ["Material"];
                            // await API.instance
                            //     .service(staticResourcePath)
                            //     .patch(resource.id, { tags: tags, project: projectName });
                            console.log("exported material data to ", ...urls);
                        }}
                    >
                        Save
                    </Button>
                    <div className="mx-2 h-full border-l"></div>
                    <Button
                        className="flex w-10 flex-grow items-center justify-center text-xs"
                        variant="outline"
                        onClick={() => {
                            useSelected.set(!useSelected.value);
                        }}
                    >
                        {useSelected.value ? <HiFilter /> : <HiGlobeAlt />}
                    </Button>
                </div>
            </div>
            <div id="material-panel" className="h-full overflow-hidden">
                <AutoSizer onResize={MaterialList}>{MaterialList}</AutoSizer>
            </div>
        </div>
    );
}
