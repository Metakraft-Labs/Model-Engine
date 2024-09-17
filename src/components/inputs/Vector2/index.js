import React from "react";
import { useHookstate } from "../../../hyperflux";

import { Vector2_Zero } from "../../../spatial/common/constants/MathConstants";
import NumericInput from "../Numeric";
import { Vector3Scrubber } from "../Vector3";

export const Vector2Input = ({
    uniformScaling,
    smallStep,
    mediumStep,
    largeStep,
    value,
    hideLabels,
    onChange,
    onRelease,
    min,
    max,
    ...rest
}) => {
    const uniformEnabled = useHookstate(uniformScaling);

    const processChange = (field, fieldValue) => {
        if (uniformEnabled.value) {
            value.set(fieldValue, fieldValue);
        } else {
            let clampedValue = fieldValue;
            if (min !== undefined) {
                clampedValue = Math.max(min, clampedValue);
            }
            if (max !== undefined) {
                clampedValue = Math.min(max, clampedValue);
            }
            value[field] = clampedValue;
        }
    };

    const onChangeX = x => {
        processChange("x", x);
        onChange(value);
    };

    const onChangeY = y => {
        processChange("y", y);
        onChange(value);
    };

    const onReleaseX = x => {
        processChange("x", x);
        onRelease?.(value);
    };

    const onReleaseY = y => {
        processChange("y", y);
        onRelease?.(value);
    };

    const vx = value.x;
    const vy = value.y;

    return (
        <div className="flex flex-row justify-end gap-1.5">
            <NumericInput
                {...rest}
                value={vx}
                onChange={onChangeX}
                onRelease={onReleaseX}
                prefix={
                    hideLabels ? null : (
                        <Vector3Scrubber
                            {...rest}
                            value={vx}
                            onChange={onChangeX}
                            onPointerUp={onRelease}
                            axis="x"
                        />
                    )
                }
            />
            <NumericInput
                {...rest}
                value={vy}
                onChange={onChangeY}
                onRelease={onReleaseY}
                prefix={
                    hideLabels ? null : (
                        <Vector3Scrubber
                            {...rest}
                            value={vy}
                            onChange={onChangeY}
                            onPointerUp={onRelease}
                            axis="y"
                        />
                    )
                }
            />
        </div>
    );
};

Vector2Input.defaultProps = {
    value: Vector2_Zero,
    hideLabels: false,
    onChange: () => {},
};

export default Vector2Input;
