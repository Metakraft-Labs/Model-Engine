import React from "react";
import { useTranslation } from "react-i18next";

import { GiMeshBall } from "react-icons/gi";
import { HiMinus, HiPlusSmall } from "react-icons/hi2";
import { getComponent } from "../../../../ecs/ComponentFunctions";
import { MeshComponent } from "../../../../spatial/renderer/components/MeshComponent";
import Accordion from "../../../Accordion";
import MaterialEditor from "../../panels/Properties/material";
import NodeEditor from "../nodeEditor";
import GeometryEditor from "./geometryEditor";

const MeshNodeEditor = props => {
    const entity = props.entity;
    const { t } = useTranslation();
    const meshComponent = getComponent(entity, MeshComponent);
    return (
        <NodeEditor
            name={t("editor:properties.mesh.name")}
            description={t("editor:properties.mesh.description")}
            icon={<MeshNodeEditor.iconComponent />}
            {...props}
        >
            <Accordion
                title={t("editor:properties.mesh.geometryEditor")}
                expandIcon={<HiPlusSmall />}
                shrinkIcon={<HiMinus />}
            >
                <GeometryEditor geometry={meshComponent?.geometry ?? null} />
            </Accordion>
            <Accordion
                title={t("editor:properties.mesh.materialEditor")}
                expandIcon={<HiPlusSmall />}
                shrinkIcon={<HiMinus />}
            >
                <MaterialEditor materialUUID={(meshComponent?.material).uuid ?? null} />
            </Accordion>
        </NodeEditor>
    );
};

MeshNodeEditor.iconComponent = GiMeshBall;

export default MeshNodeEditor;
