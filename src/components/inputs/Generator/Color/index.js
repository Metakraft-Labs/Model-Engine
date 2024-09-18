import React, { useCallback } from "react";
import { Color } from "three";

import { Grid, Typography } from "@mui/material";
import { ColorGeneratorJSONDefaults } from "../../../../engine/scene/components/ParticleSystemComponent";
import Button from "../../../Button";
import ColorInput from "../../../Color";
import InputGroup from "../../../Group";
import SelectInput from "../../../Select";
import NumericInput from "../../Numeric";

export function ColorJSONInput({ value, onChange }) {
    return (
        <>
            <InputGroup name="color" label="Color">
                <ColorInput
                    value={new Color(value.r, value.g, value.b)}
                    onChange={color => {
                        onChange({ r: color.r, g: color.g, b: color.b, a: value.a });
                    }}
                />
            </InputGroup>
            <InputGroup name="opacity" label="Opacity">
                <NumericInput
                    value={value.a}
                    onChange={alpha => onChange({ r: value.r, g: value.g, b: value.b, a: alpha })}
                />
            </InputGroup>
        </>
    );
}

export default function ColorGenerator({ scope, value, onChange }) {
    const onChangeType = useCallback(() => {
        const thisOnChange = onChange(scope.type);
        return type => {
            scope.set(ColorGeneratorJSONDefaults[type]);
            thisOnChange(type);
        };
    }, []);

    const ConstantColorInput = useCallback(() => {
        const constantScope = scope;
        const constant = constantScope.value;
        return <ColorJSONInput value={constant.color} onChange={onChange(constantScope.color)} />;
    }, [scope]);

    // const ColorRangeInput = useCallback(() => {
    //   const rangeScope = scope
    //   const range = rangeScope.value
    //   return (
    //     <>
    //       <InputGroup name="A" label="A">
    //         <ColorJSONInput value={range.a} onChange={onChange(rangeScope.a)} />
    //       </InputGroup>
    //       <InputGroup name="B" label="B">
    //         <ColorJSONInput value={range.b} onChange={onChange(rangeScope.b)} />
    //       </InputGroup>
    //     </>
    //   )
    // }, [scope])

    const RandomColorInput = useCallback(() => {
        const randomScope = scope;
        const random = randomScope.value;
        return (
            <>
                <InputGroup name="A" label="A">
                    <ColorJSONInput value={random.a} onChange={onChange(randomScope.a)} />
                </InputGroup>
                <InputGroup name="B" label="B">
                    <ColorJSONInput value={random.b} onChange={onChange(randomScope.b)} />
                </InputGroup>
            </>
        );
    }, [scope]);

    const onRemoveGradient = useCallback(element => {
        const gradientScope = scope;
        const gradient = gradientScope.value;
        const thisOnChange = onChange(gradientScope.functions);
        return () => {
            const nuFunctions = gradient.functions.filter(item => item !== element.value);
            thisOnChange(JSON.parse(JSON.stringify(nuFunctions)));
        };
    }, []);

    const GradientInput = useCallback(() => {
        const gradientScope = scope;
        const gradient = gradientScope.value;
        return (
            <div>
                <Button
                    onClick={() => {
                        const gradientState = scope;
                        gradientState.functions.set([
                            ...JSON.parse(JSON.stringify(gradient.functions)),
                            {
                                start: 0,
                                function: {
                                    type: "ColorRange",
                                    a: { r: 1, g: 1, b: 1, a: 1 },
                                    b: { r: 1, g: 1, b: 1, a: 1 },
                                },
                            },
                        ]);
                    }}
                >
                    +
                </Button>

                {gradient.functions.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            border: "1px solid white",
                            borderRadius: "0.5rem",
                            margin: "1rem",
                            padding: "1.5rem",
                            overflow: "auto",
                        }}
                    >
                        <Grid
                            container
                            spacing={1}
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Grid item xs={2}>
                                <Typography>Start</Typography>
                            </Grid>
                            <Grid item xs={10}>
                                <NumericInput
                                    value={item.start}
                                    onChange={onChange(gradientScope.functions[index].start)}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <Typography>A</Typography>
                            </Grid>
                            <Grid item xs={10}>
                                <ColorJSONInput
                                    value={item.function.a}
                                    onChange={onChange(gradientScope.functions[index].function.a)}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <Typography>B</Typography>
                            </Grid>
                            <Grid item xs={10}>
                                <ColorJSONInput
                                    value={item.function.b}
                                    onChange={onChange(gradientScope.functions[index].function.b)}
                                />
                            </Grid>
                        </Grid>
                        <Button onClick={onRemoveGradient(gradientScope.functions[index])}>
                            Remove
                        </Button>
                    </div>
                ))}
            </div>
        );
    }, [scope]);

    const colorInputs = {
        ConstantColor: ConstantColorInput,
        ColorRangeRangeInput,
        RandomColor: RandomColorInput,
        Gradient: GradientInput,
    };

    return (
        <div>
            <InputGroup name="type" label="Type">
                <SelectInput
                    value={value.type}
                    options={[
                        { label: "Constant", value: "ConstantColor" },
                        { label: "Range", value: "ColorRange" },
                        { label: "Random", value: "RandomColor" },
                        { label: "Gradient", value: "Gradient" },
                    ]}
                    onChange={onChangeType()}
                />
            </InputGroup>
            {colorInputs[value.type]()}
        </div>
    );
}
