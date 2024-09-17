import React from "react";
import { LuLock, LuUnlock } from "react-icons/lu";
import { twMerge } from "tailwind-merge";
import { useHookstate } from "../../../hyperflux";
import { Vector3_Zero } from "../../../spatial/common/constants/MathConstants";
import Button from "../../Button";
import Scrubber from "../../scene-editor/layout/Scrubber";
import NumericInput from "../Numeric";

export const Vector3Scrubber = ({ axis, onChange, onPointerUp, value, children, ...props }) => {
    const color = (() => {
        switch (axis) {
            case "x":
                return "red-500";
            case "y":
                return "green-400";
            case "z":
                return "blue-400";
            default:
                return "inherit";
        }
    })();

    props.className = twMerge(`w-full text-${color}`);
    const content = children ?? `${axis?.toUpperCase()} - `;
    return (
        <Scrubber onChange={onChange} onRelease={onPointerUp} value={value} {...props}>
            {content}
        </Scrubber>
    );
};

export const UniformButtonContainer = ({ children }) => {
    return (
        <div className="flex w-6 items-center hover:text-[color:var(--blueHover)] [&>*:where(label)]:text-[color:var(--textColor)] [&>*:where(ul)]:w-full">
            {children}
        </div>
    );
};

export const Vector3Input = ({
    uniformScaling,
    smallStep,
    mediumStep,
    largeStep,
    value,
    hideLabels,
    onChange,
    onRelease,
    ...rest
}) => {
    const uniformEnabled = useHookstate(false);

    const onToggleUniform = () => {
        uniformEnabled.set(v => !v);
    };

    const processChange = (field, fieldValue) => {
        if (uniformEnabled.value) {
            value.set(fieldValue, fieldValue, fieldValue);
        } else {
            value[field] = fieldValue;
        }
    };

    const onChangeAxis = axis => axisValue => {
        processChange(axis, axisValue);
        onChange(value);
    };

    const onReleaseAxis = axis => axisValue => {
        processChange(axis, axisValue);
        onRelease?.(value);
    };

    const vx = value.x;
    const vy = value.y;
    const vz = value.z;

    return (
        <div className="flex flex-row flex-wrap justify-end gap-1.5">
            {uniformScaling && (
                <Button
                    variant="transparent"
                    startIcon={uniformEnabled.value ? <LuLock /> : <LuUnlock />}
                    onClick={onToggleUniform}
                    className="p-0"
                />
            )}
            <NumericInput
                {...rest}
                value={vx}
                onChange={onChangeAxis("x")}
                onRelease={onReleaseAxis("x")}
                prefix={
                    hideLabels ? null : (
                        <Vector3Scrubber
                            {...rest}
                            value={vx}
                            onChange={onChangeAxis("x")}
                            onPointerUp={onRelease}
                            axis="x"
                        />
                    )
                }
            />
            <NumericInput
                {...rest}
                value={vy}
                onChange={onChangeAxis("y")}
                onRelease={onReleaseAxis("y")}
                prefix={
                    hideLabels ? null : (
                        <Vector3Scrubber
                            {...rest}
                            value={vy}
                            onChange={onChangeAxis("y")}
                            onPointerUp={onRelease}
                            axis="y"
                        />
                    )
                }
            />
            <NumericInput
                {...rest}
                value={vz}
                onChange={onChangeAxis("z")}
                onRelease={onReleaseAxis("z")}
                prefix={
                    hideLabels ? null : (
                        <Vector3Scrubber
                            {...rest}
                            value={vz}
                            onChange={onChangeAxis("z")}
                            onPointerUp={onRelease}
                            axis="z"
                        />
                    )
                }
            />
        </div>
    );
};

Vector3Input.defaultProps = {
    value: Vector3_Zero,
    hideLabels: false,
    onChange: () => {},
};

export default Vector3Input;
