import React from "react";
import { useTranslation } from "react-i18next";
import { FiMinimize2 } from "react-icons/fi";
import { camelCaseToSpacedString } from "../../../../common/src/utils/camelCaseToSpacedString";
import { useComponent } from "../../../../ecs";
import {
    ColliderComponent,
    supportedColliderShapes,
} from "../../../../spatial/physics/components/ColliderComponent";
import { Shapes } from "../../../../spatial/physics/types/PhysicsTypes";
import InputGroup from "../../../Group";
import NumericInput from "../../../inputs/Numeric";
import Vector3Input from "../../../inputs/Vector3";
import SelectInput from "../../../Select";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

const shapeTypeOptions = Object.entries(Shapes)
    .filter(([_, value]) => supportedColliderShapes.includes(value))
    .map(([label, value]) => ({
        label: camelCaseToSpacedString(label),
        value,
    }));

export const ColliderComponentEditor = props => {
    const { t } = useTranslation();
    const colliderComponent = useComponent(props.entity, ColliderComponent);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.collider.name")}
            description={t("editor:properties.collider.description")}
            icon={<ColliderComponentEditor.iconComponent />}
        >
            <InputGroup name="Shape" label={t("editor:properties.collider.lbl-shape")}>
                <SelectInput
                    options={shapeTypeOptions}
                    value={colliderComponent.shape.value}
                    onChange={commitProperty(ColliderComponent, "shape")}
                />
            </InputGroup>
            <InputGroup name="Mass" label={t("editor:properties.collider.lbl-mass")}>
                <NumericInput
                    value={colliderComponent.mass.value}
                    onChange={commitProperty(ColliderComponent, "mass")}
                />
            </InputGroup>
            <InputGroup
                name="Mass Center"
                label={t("editor:properties.collider.lbl-massCenter")}
                className="w-auto"
            >
                <Vector3Input
                    value={colliderComponent.massCenter.value}
                    onChange={commitProperty(ColliderComponent, "massCenter")}
                />
            </InputGroup>
            <InputGroup name="Friction" label={t("editor:properties.collider.lbl-friction")}>
                <NumericInput
                    value={colliderComponent.friction.value}
                    onChange={commitProperty(ColliderComponent, "friction")}
                />
            </InputGroup>
            <InputGroup name="Restitution" label={t("editor:properties.collider.lbl-restitution")}>
                <NumericInput
                    value={colliderComponent.restitution.value}
                    onChange={commitProperty(ColliderComponent, "restitution")}
                />
            </InputGroup>
            <InputGroup
                name="Collision Layer"
                label={t("editor:properties.collider.lbl-collisionLayer")}
            >
                <NumericInput
                    value={colliderComponent.collisionLayer.value}
                    onChange={commitProperty(ColliderComponent, "collisionLayer")}
                />
            </InputGroup>
            <InputGroup
                name="Collision Mask"
                label={t("editor:properties.collider.lbl-collisionMask")}
            >
                <NumericInput
                    value={colliderComponent.collisionMask.value}
                    onChange={commitProperty(ColliderComponent, "collisionMask")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

ColliderComponentEditor.iconComponent = FiMinimize2;

export default ColliderComponentEditor;
