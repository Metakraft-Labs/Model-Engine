import { MdInterests } from "react-icons/md";

import React from "react";
import { useTranslation } from "react-i18next";

import { useComponent } from "../../../../../ecs/ComponentFunctions";
import { getEntityErrors } from "../../../../../engine/scene/components/ErrorComponent";
import { PrimitiveGeometryComponent } from "../../../../../engine/scene/components/PrimitiveGeometryComponent";
import { GeometryTypeEnum } from "../../../../../engine/scene/constants/GeometryTypeEnum";
import { NO_PROXY } from "../../../../../hyperflux";
import { MeshComponent } from "../../../../../spatial/renderer/components/MeshComponent";
import InputGroup from "../../../../Group";
import SelectInput from "../../../../Select";
import NodeEditor from "../../nodeEditor";
import ParameterInput from "../../parameter";
import { commitProperties, commitProperty } from "../../Util";

const GeometryOption = [
    {
        label: "Box",
        value: GeometryTypeEnum.BoxGeometry,
    },
    {
        label: "Sphere",
        value: GeometryTypeEnum.SphereGeometry,
    },
    {
        label: "Cylinder",
        value: GeometryTypeEnum.CylinderGeometry,
    },
    {
        label: "Capsule",
        value: GeometryTypeEnum.CapsuleGeometry,
    },
    {
        label: "Plane",
        value: GeometryTypeEnum.PlaneGeometry,
    },
    {
        label: "Circle",
        value: GeometryTypeEnum.CircleGeometry,
    },
    {
        label: "Ring",
        value: GeometryTypeEnum.RingGeometry,
    },
    {
        label: "Torus",
        value: GeometryTypeEnum.TorusGeometry,
    },
    {
        label: "Dodecahedron",
        value: GeometryTypeEnum.DodecahedronGeometry,
    },
    {
        label: "Icosahedron",
        value: GeometryTypeEnum.IcosahedronGeometry,
    },
    {
        label: "Octahedron",
        value: GeometryTypeEnum.OctahedronGeometry,
    },
    {
        label: "Tetrahedron",
        value: GeometryTypeEnum.TetrahedronGeometry,
    },
    {
        label: "TorusKnot",
        value: GeometryTypeEnum.TorusKnotGeometry,
    },
];

/**
 * SkyboxNodeEditor component class used to render editor view to customize component property.
 *
 * @type {class component}
 */

export const PrimitiveGeometryNodeEditor = props => {
    const { t } = useTranslation();
    const entity = props.entity;
    const hasError = getEntityErrors(entity, PrimitiveGeometryComponent);
    const primitiveGeometry = useComponent(entity, PrimitiveGeometryComponent);
    const geometry = useComponent(entity, MeshComponent).geometry.get(NO_PROXY);

    const renderPrimitiveGeometrySettings = () => (
        <ParameterInput
            entity={`${props.entity}-primitive-geometry`}
            values={geometry.parameters ?? {}}
            onChange={key => commitProperty(PrimitiveGeometryComponent, `geometryParams.${key}`)}
        />
    );

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.primitiveGeometry.name")}
            description={t("editor:properties.primitiveGeometry.description")}
            icon={<PrimitiveGeometryNodeEditor.iconComponent />}
        >
            <InputGroup
                name="Geometry Type"
                label={t("editor:properties.primitiveGeometry.lbl-geometryType")}
            >
                <SelectInput
                    key={props.entity}
                    options={GeometryOption}
                    value={primitiveGeometry.geometryType.value}
                    onChange={value => {
                        commitProperties(PrimitiveGeometryComponent, {
                            geometryType: value,
                            geometryParams: {},
                        });
                    }}
                />
            </InputGroup>
            {renderPrimitiveGeometrySettings()}
        </NodeEditor>
    );
};

PrimitiveGeometryNodeEditor.iconComponent = MdInterests;

export default PrimitiveGeometryNodeEditor;
