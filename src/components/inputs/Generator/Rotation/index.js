import React, { useCallback } from "react";
import { Vector3 } from "three";

import { RotationGeneratorJSONDefaults } from "../../../../engine/scene/components/ParticleSystemComponent";
import SelectInput from "../../../Select";
import InputGroup from "../../Group";
import Vector3Input from "../../Vector3";
import ValueGenerator from "../Value";

export default function RotationGenerator({ scope, value, onChange }) {
    const onChangeVec3 = useCallback(scope => {
        const thisOnChange = onChange(scope);
        return vec3 => {
            thisOnChange([...vec3.toArray()]);
        };
    }, []);

    const AxisAngleGeneratorInput = useCallback(() => {
        const axisAngleScope = scope;
        const axisAngle = axisAngleScope.value;
        return (
            <>
                <InputGroup name="Axis" label="Axis">
                    <Vector3Input
                        value={new Vector3(...axisAngle.axis)}
                        onChange={onChangeVec3(axisAngleScope.axis)}
                    />
                </InputGroup>
                <InputGroup name="Angle" label="Angle">
                    <ValueGenerator
                        scope={axisAngleScope.angle}
                        value={axisAngle.angle}
                        onChange={onChange}
                    />
                </InputGroup>
            </>
        );
    }, []);

    const EulerGeneratorInput = useCallback(() => {
        const eulerScope = scope;
        const euler = eulerScope.value;
        return (
            <>
                <InputGroup name="Angle X" label="Angle X">
                    <ValueGenerator
                        scope={eulerScope.angleX}
                        value={euler.angleX}
                        onChange={onChange}
                    />
                </InputGroup>
                <InputGroup name="Angle Y" label="Angle Y">
                    <ValueGenerator
                        scope={eulerScope.angleY}
                        value={euler.angleY}
                        onChange={onChange}
                    />
                </InputGroup>
                <InputGroup name="Angle Z" label="Angle Z">
                    <ValueGenerator
                        scope={eulerScope.angleZ}
                        value={euler.angleZ}
                        onChange={onChange}
                    />
                </InputGroup>
            </>
        );
    }, []);

    const RandomQuatGeneratorInput = useCallback(() => {
        return <></>;
    }, []);

    const onChangeRotationType = useCallback(() => {
        const thisOnChange = onChange(scope.type);
        return type => {
            scope.set(RotationGeneratorJSONDefaults[type]);
            thisOnChange(type);
        };
    }, []);

    const rotationInputs = {
        AxisAngle: AxisAngleGeneratorInput,
        Euler: EulerGeneratorInput,
        RandomQuat: RandomQuatGeneratorInput,
    };

    return (
        <>
            <InputGroup name="Type" label="Type">
                <SelectInput
                    value={value.type}
                    options={[
                        { label: "Axis Angle", value: "AxisAngle" },
                        { label: "Euler", value: "Euler" },
                        { label: "Random Quaternion", value: "RandomQuat" },
                    ]}
                    onChange={onChangeRotationType()}
                />
            </InputGroup>
            {rotationInputs[value.type]()}
        </>
    );
}
