import React, { useCallback, useEffect } from "react";
import { Euler, MathUtils as _Math } from "three";
import { useHookstate } from "../../../hyperflux";
import { Q_IDENTITY } from "../../../spatial/common/constants/MathConstants";
import NumericInput from "../Numeric";
import { Vector3Scrubber } from "../Vector3";

const { RAD2DEG, DEG2RAD } = _Math;

/**
 * FileIEulerInputnput used to show EulerInput.
 *
 * @type {Object}
 */
export const EulerInput = props => {
    const euler = useHookstate(new Euler().setFromQuaternion(props.quaternion, "YXZ"));

    useEffect(() => {
        euler.value.setFromQuaternion(props.quaternion, "YXZ");
    }, [props]);

    const onSetEuler = useCallback(
        component => value => {
            const radVal = value * DEG2RAD;
            euler[component].value !== radVal &&
                (euler[component].set(radVal) || props.onChange?.(euler.value));
        },
        [],
    );

    return (
        <div className="flex flex-wrap justify-end gap-1.5">
            <NumericInput
                value={euler.x.value * RAD2DEG}
                onChange={onSetEuler("x")}
                onRelease={() => props.onRelease?.(euler.value)}
                unit={props.unit}
                prefix={
                    <Vector3Scrubber
                        value={euler.x.value * RAD2DEG}
                        onChange={onSetEuler("x")}
                        axis="x"
                        onPointerUp={props.onRelease}
                    />
                }
            />
            <NumericInput
                value={euler.y.value * RAD2DEG}
                onChange={onSetEuler("y")}
                onRelease={() => props.onRelease?.(euler.value)}
                unit={props.unit}
                prefix={
                    <Vector3Scrubber
                        value={euler.y.value * RAD2DEG}
                        onChange={onSetEuler("y")}
                        axis="y"
                        onPointerUp={props.onRelease}
                    />
                }
            />
            <NumericInput
                value={euler.z.value * RAD2DEG}
                onChange={onSetEuler("z")}
                onRelease={() => props.onRelease?.(euler.value)}
                unit={props.unit}
                prefix={
                    <Vector3Scrubber
                        value={euler.z.value * RAD2DEG}
                        onChange={onSetEuler("z")}
                        axis="z"
                        onPointerUp={props.onRelease}
                    />
                }
            />
        </div>
    );
};

EulerInput.defaultProps = {
    quaternion: Q_IDENTITY,
};
export default EulerInput;
