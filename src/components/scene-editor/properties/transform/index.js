import React from "react";
import { useTranslation } from "react-i18next";
import { Quaternion, Vector3 } from "three";

import {
    getComponent,
    hasComponent,
    useComponent,
    useOptionalComponent,
} from "../../../../ecs/ComponentFunctions";
import { SceneDynamicLoadTagComponent } from "../../../../engine/scene/components/SceneDynamicLoadTagComponent";
import { getMutableState, getState, useHookstate } from "../../../../hyperflux";

import { LuMove3D } from "react-icons/lu";

import { ObjectGridSnapState } from "../../systems/ObjectGridSnapSystem";
import { commitProperty, updateProperty } from "../Util";

import { TransformSpace } from "../../../../engine/scene/constants/transformConstants";
import { TransformComponent } from "../../../../spatial";
import { EditorControlFunctions } from "../../functions/EditorControlFunctions";
import { EditorHelperState } from "../../services/EditorHelperState";
import { SelectionState } from "../../services/SelectionServices";

import BooleanInput from "../../../Boolean";
import InputGroup from "../../../Group";
import EulerInput from "../../../inputs/Euler";
import NumericInput from "../../../inputs/Numeric";
import Vector3Input from "../../../inputs/Vector3";
import PropertyGroup from "../group";

const position = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3();

/**
 * TransformPropertyGroup component is used to render editor view to customize properties.
 */
export const TransformPropertyGroup = props => {
    const { t } = useTranslation();

    useOptionalComponent(props.entity, SceneDynamicLoadTagComponent);
    const transformComponent = useComponent(props.entity, TransformComponent);
    const transformSpace = useHookstate(getMutableState(EditorHelperState).transformSpace);

    position.copy(transformComponent.position.value);
    rotation.copy(transformComponent.rotation.value);
    scale.copy(transformComponent.scale.value);

    if (transformSpace.value === TransformSpace.world)
        transformComponent.matrixWorld.value.decompose(position, rotation, scale);

    const onRelease = () => {
        const bboxSnapState = getState(ObjectGridSnapState);
        if (bboxSnapState.enabled) {
            ObjectGridSnapState.apply();
        } else {
            EditorControlFunctions.commitTransformSave([props.entity]);
        }
    };

    const onChangeDynamicLoad = value => {
        const selectedEntities = SelectionState.getSelectedEntities();
        EditorControlFunctions.addOrRemoveComponent(
            selectedEntities,
            SceneDynamicLoadTagComponent,
            value,
        );
    };

    const onChangePosition = value => {
        const selectedEntities = SelectionState.getSelectedEntities();
        EditorControlFunctions.positionObject(selectedEntities, [value]);
    };

    const onChangeRotation = value => {
        const selectedEntities = SelectionState.getSelectedEntities();
        EditorControlFunctions.rotateObject(selectedEntities, [value]);
    };

    const onChangeScale = value => {
        const selectedEntities = SelectionState.getSelectedEntities();
        EditorControlFunctions.scaleObject(selectedEntities, [value], true);
    };

    return (
        <PropertyGroup
            name={t("editor:properties.transform.title")}
            description={t("editor:properties.transform.description")}
            icon={<TransformPropertyGroup.iconComponent />}
        >
            <InputGroup
                name="Dynamically Load Children"
                label={t("editor:properties.lbl-dynamicLoad")}
                labelClassName="font-normal text-[#6B6D78]"
                className="w-auto"
            >
                <BooleanInput
                    value={hasComponent(props.entity, SceneDynamicLoadTagComponent)}
                    onChange={onChangeDynamicLoad}
                    className="mr-2"
                />
                {hasComponent(props.entity, SceneDynamicLoadTagComponent) && (
                    <NumericInput
                        min={1}
                        max={100}
                        value={getComponent(props.entity, SceneDynamicLoadTagComponent).distance}
                        onChange={updateProperty(SceneDynamicLoadTagComponent, "distance")}
                        onRelease={commitProperty(SceneDynamicLoadTagComponent, "distance")}
                    />
                )}
            </InputGroup>
            <InputGroup
                name="Position"
                label={t("editor:properties.transform.lbl-position")}
                className="w-auto"
            >
                <Vector3Input
                    smallStep={0.01}
                    mediumStep={0.1}
                    largeStep={1}
                    value={position}
                    onChange={onChangePosition}
                    onRelease={onRelease}
                />
            </InputGroup>
            <InputGroup
                name="Rotation"
                label={t("editor:properties.transform.lbl-rotation")}
                className="w-auto"
            >
                <EulerInput
                    quaternion={rotation}
                    onChange={onChangeRotation}
                    unit="°"
                    onRelease={onRelease}
                />
            </InputGroup>
            <InputGroup
                name="Scale"
                label={t("editor:properties.transform.lbl-scale")}
                className="w-auto"
            >
                <Vector3Input
                    uniformScaling
                    smallStep={0.01}
                    mediumStep={0.1}
                    largeStep={1}
                    value={scale}
                    onChange={onChangeScale}
                    onRelease={onRelease}
                />
            </InputGroup>
        </PropertyGroup>
    );
};

TransformPropertyGroup.iconComponent = LuMove3D;

export default TransformPropertyGroup;
