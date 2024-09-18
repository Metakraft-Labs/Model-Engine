import React from "react";
import { useTranslation } from "react-i18next";

import { MdCameraswitch } from "react-icons/md";
import { getComponent, useComponent } from "../../../../../ecs/ComponentFunctions";
import { SplineTrackComponent } from "../../../../../engine/scene/components/SplineTrackComponent";

import { UUIDComponent } from "../../../../../ecs";
import { useQuery } from "../../../../../ecs/QueryFunctions";
import { SplineComponent } from "../../../../../engine/scene/components/SplineComponent";
import { NameComponent } from "../../../../../spatial/common/NameComponent";
import { BooleanInput } from "../../../../Boolean";
import InputGroup from "../../../../Group";
import NumericInput from "../../../../inputs/Numeric";
import { Vector3Scrubber } from "../../../../inputs/Vector3";
import SelectInput from "../../../../Select";
import NodeEditor from "../../nodeEditor";
import { commitProperty, updateProperty } from "../../Util";

/**
 * SplineTrackNodeEditor adds rotation editing to splines.
 *
 * @param       {Object} props
 * @constructor
 */

export const SplineTrackNodeEditor = props => {
    const { t } = useTranslation();
    const component = useComponent(props.entity, SplineTrackComponent);
    const velocity = component.velocity;
    const alpha = component.velocity;

    const availableSplines = useQuery([SplineComponent]).map(entity => {
        const name = getComponent(entity, NameComponent);
        const uuid = getComponent(entity, UUIDComponent);
        return {
            label: name,
            value: uuid,
        };
    });

    // @todo allow these to be passed in or remove this capability

    const setAlpha = value => {
        component.alpha.set(value);
    };

    return (
        <NodeEditor
            description={t("editor:properties.splinetrack.description")}
            icon={<SplineTrackNodeEditor.iconComponent />}
            {...props}
        >
            <InputGroup name="Spline" label={t("editor:properties.splinetrack.lbl-spline")}>
                <SelectInput
                    key={props.entity}
                    options={availableSplines}
                    value={component.splineEntityUUID.value}
                    onChange={commitProperty(SplineTrackComponent, "splineEntityUUID")}
                />
            </InputGroup>
            <InputGroup name="Velocity" label={t("editor:properties.splinetrack.lbl-velocity")}>
                <NumericInput
                    value={velocity.value}
                    onChange={updateProperty(SplineTrackComponent, "velocity")}
                    onRelease={commitProperty(SplineTrackComponent, "velocity")}
                    prefix={
                        <Vector3Scrubber
                            value={velocity.value}
                            onChange={updateProperty(SplineTrackComponent, "velocity")}
                            onPointerUp={commitProperty(SplineTrackComponent, "velocity")}
                        />
                    }
                />
            </InputGroup>
            <InputGroup
                name="Enable Rotation"
                label={t("editor:properties.splinetrack.lbl-enableRotation")}
            >
                <BooleanInput
                    value={component.enableRotation.value}
                    onChange={commitProperty(SplineTrackComponent, "enableRotation")}
                />
            </InputGroup>
            <InputGroup name="Lock XZ" label={t("editor:properties.splinetrack.lbl-lockXZ")}>
                <BooleanInput
                    value={component.lockToXZPlane.value}
                    onChange={commitProperty(SplineTrackComponent, "lockToXZPlane")}
                />
            </InputGroup>
            <InputGroup name="Loop" label={t("editor:properties.splinetrack.lbl-loop")}>
                <BooleanInput
                    value={component.loop.value}
                    onChange={commitProperty(SplineTrackComponent, "loop")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

SplineTrackNodeEditor.iconComponent = MdCameraswitch;

export default SplineTrackNodeEditor;
