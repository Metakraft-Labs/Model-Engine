import React, { useRef } from "react";
import { twMerge } from "tailwind-merge";
import { MathUtils } from "three";
import { toPrecision } from "../../../common/src/utils/miscUtils";
import { useHookstate } from "../../../hyperflux";
import { getStepSize } from "../functions/utils";

const Scrubber = ({
    className,
    children,
    smallStep,
    mediumStep,
    largeStep,
    sensitivity,
    min,
    max,
    precision,
    convertFrom,
    convertTo,
    value,
    onChange,
    onRelease,
    ...rest
}) => {
    const containerClassName = twMerge(
        "flex items-center",
        "cursor-ew-resize p-1",
        "text-xs font-normal",
        className,
    );

    const state = useHookstate({
        isDragging: false,
        startValue: 0,
        delta: 0,
        mouseX: 0,
        mouseY: 0,
        currentValue: 0,
    });

    const scrubberEl = useRef < HTMLDivElement > null;

    const handleMouseMove = event => {
        if (state.isDragging.value) {
            const mX = state.mouseX.value + event.movementX;
            const mY = state.mouseY.value + event.movementY;
            const nextDelta = state.delta.value + event.movementX;
            const stepSize = getStepSize(event, smallStep, mediumStep, largeStep);
            const nextValue =
                state.startValue.value + Math.round(nextDelta / (sensitivity || 1)) * stepSize;
            const clampedValue = MathUtils.clamp(nextValue, min ?? -Infinity, max ?? Infinity);
            const roundedValue = precision ? toPrecision(clampedValue, precision) : clampedValue;
            const finalValue = convertTo(roundedValue);
            onChange(finalValue);

            state.merge({
                currentValue: finalValue,
                delta: nextDelta,
                mouseX: mX,
                mouseY: mY,
            });
        }
    };

    const handleMouseUp = () => {
        if (state.isDragging.value) {
            state.merge({
                isDragging: false,
                startValue: 0,
                delta: 0,
                mouseX: 0,
                mouseY: 0,
            });

            if (onRelease) {
                onRelease(state.currentValue.value);
            }

            document.exitPointerLock();
        }
    };

    const handleMouseDown = event => {
        state.merge({
            isDragging: true,
            startValue: convertFrom(value),
            delta: 0,
            mouseX: event.clientX,
            mouseY: event.clientY,
        });
        scrubberEl?.current?.requestPointerLock();
    };

    return (
        <div
            className={containerClassName}
            ref={scrubberEl}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            {...rest}
        >
            {children}
        </div>
    );
};

Scrubber.defaultProps = {
    smallStep: 0.025,
    mediumStep: 0.1,
    largeStep: 0.25,
    sensitivity: 5,
    min: -Infinity,
    max: Infinity,
    convertFrom: value => value,
    convertTo: value => value,
};

export default React.memo(Scrubber);
