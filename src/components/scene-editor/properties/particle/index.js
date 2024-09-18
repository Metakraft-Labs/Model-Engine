import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    AdditiveBlending,
    CustomBlending,
    MultiplyBlending,
    NoBlending,
    NormalBlending,
    SubtractiveBlending,
} from "three";
import { RenderMode } from "three.quarks";

import { HiSparkles } from "react-icons/hi";
import { getComponent, useComponent } from "../../../../ecs/ComponentFunctions";
import {
    CONE_SHAPE_DEFAULT,
    DONUT_SHAPE_DEFAULT,
    MESH_SHAPE_DEFAULT,
    POINT_SHAPE_DEFAULT,
    ParticleSystemComponent,
    SPHERE_SHAPE_DEFAULT,
} from "../../../../engine/scene/components/ParticleSystemComponent";

import BooleanInput from "../../../Boolean";
import Button from "../../../Button";
import InputGroup from "../../../Group";
import BehaviorInput from "../../../inputs/Behavior";
import ColorGenerator from "../../../inputs/Generator/Color";
import ValueGenerator from "../../../inputs/Generator/Value";
import ModelInput from "../../../inputs/Model";
import NumericInput from "../../../inputs/Numeric";
import TexturePreviewInput from "../../../inputs/Texture";
import SelectInput from "../../../Select";
import PaginatedList from "../../layout/PaginatedList";
import NodeEditor from "../nodeEditor";
import ParameterInput from "../parameter";
import { commitProperties, commitProperty } from "../Util";

const ParticleSystemNodeEditor = props => {
    const { t } = useTranslation();
    const entity = props.entity;
    const particleSystemState = useComponent(entity, ParticleSystemComponent);
    const particleSystem = particleSystemState.value;

    const onSetSystemParm = useCallback(field => {
        const parm = particleSystem.systemParameters[field];
        return value => {
            particleSystemState._refresh.set(particleSystem._refresh + 1);
            commitProperty(ParticleSystemComponent, "systemParameters." + field)(value);
        };
    }, []);

    const shapeDefaults = {
        point: POINT_SHAPE_DEFAULT,
        sphere: SPHERE_SHAPE_DEFAULT,
        cone: CONE_SHAPE_DEFAULT,
        donut: DONUT_SHAPE_DEFAULT,
        mesh_surface: MESH_SHAPE_DEFAULT,
    };

    const onChangeShape = useCallback(() => {
        const onSetShape = onSetSystemParm("shape");
        return shape => {
            onSetShape(shapeDefaults[shape]);
        };
    }, []);

    const onChangeShapeParm = useCallback(field => {
        return value => {
            const nuParms = JSON.parse(JSON.stringify(particleSystem.systemParameters.shape));
            nuParms[field] = value;
            commitProperty(ParticleSystemComponent, "systemParameters.shape")(nuParms);
            particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
        };
    }, []);

    const onSetState = useCallback(state => {
        return value => {
            state.set(value);
            const { systemParameters, behaviorParameters } = JSON.parse(
                JSON.stringify(getComponent(entity, ParticleSystemComponent)),
            );
            commitProperties(
                ParticleSystemComponent,
                {
                    systemParameters,
                    behaviorParameters,
                },
                [props.entity],
            );
            particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
        };
    }, []);

    const onAddBehavior = useCallback(() => {
        const nuBehavior = {
            type: "ApplyForce",
            direction: [0, 1, 0],
            magnitude: {
                type: "ConstantValue",
                value: 1,
            },
        };
        particleSystemState.behaviorParameters.set([
            ...JSON.parse(JSON.stringify(particleSystem.behaviorParameters)),
            nuBehavior,
        ]);
        particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
    }, []);

    const onRemoveBehavior = useCallback(
        behavior => () => {
            const data = JSON.parse(
                JSON.stringify(particleSystem.behaviorParameters.filter(b => b !== behavior)),
            );
            commitProperty(ParticleSystemComponent, "behaviorParameters")(data);
            particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
        },
        [],
    );

    const onAddBurst = useCallback(() => {
        const nuBurst = {
            time: 0,
            count: 0,
            cycle: 0,
            interval: 0,
            probability: 0,
        };
        const data = [
            ...JSON.parse(JSON.stringify(particleSystem.systemParameters.emissionBursts)),
            nuBurst,
        ];
        commitProperty(ParticleSystemComponent, "systemParameters.emissionBursts")(data);
        particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
    }, []);

    const onRemoveBurst = useCallback(burst => {
        return () => {
            const data = JSON.parse(
                JSON.stringify(
                    particleSystem.systemParameters.emissionBursts.filter(b => b !== burst.value),
                ),
            );
            commitProperty(ParticleSystemComponent, "systemParameters.emissionBursts")(data);
            particleSystemState._refresh.set((particleSystem._refresh + 1) % 1000);
        };
    }, []);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.particle-system.name")}
            description={t("editor:properties.particle-system.description")}
            icon={<ParticleSystemNodeEditor.iconComponent />}
        >
            <InputGroup name="Looping" label={t("editor:properties.particle-system.looping")}>
                <BooleanInput
                    value={particleSystem.systemParameters.looping}
                    onChange={onSetSystemParm("looping")}
                />
            </InputGroup>

            <InputGroup name="Duration" label={t("editor:properties.particle-system.duration")}>
                <NumericInput
                    value={particleSystem.systemParameters.duration}
                    onChange={onSetSystemParm("duration")}
                />
            </InputGroup>

            <InputGroup name="Prewarm" label={t("editor:properties.particle-system.prewarm")}>
                <BooleanInput
                    value={particleSystem.systemParameters.prewarm}
                    onChange={onSetSystemParm("prewarm")}
                />
            </InputGroup>

            <InputGroup
                name="Emitter Shape"
                label={t("editor:properties.particle-system.emitter-shape")}
            >
                <SelectInput
                    value={particleSystem.systemParameters.shape.type}
                    onChange={onChangeShape()}
                    options={[
                        { label: "Point", value: "point" },
                        { label: "Sphere", value: "sphere" },
                        { label: "Cone", value: "cone" },
                        { label: "Donut", value: "donut" },
                        { label: "Mesh", value: "mesh_surface" },
                    ]}
                />
            </InputGroup>

            <InputGroup
                name="Emission Bursts"
                label={t("editor:properties.particle-system.emission-bursts")}
            >
                <Button onClick={onAddBurst}>Add Burst</Button>
            </InputGroup>
            <PaginatedList
                list={
                    particleSystem.systemParameters.emissionBursts
                        ? particleSystemState.systemParameters.emissionBursts
                        : []
                }
                element={burst => {
                    return (
                        <div>
                            <InputGroup
                                name="Time"
                                label={t("editor:properties.particle-system.burst.time")}
                            >
                                <NumericInput
                                    value={burst.time.value}
                                    onChange={onSetState(burst.time)}
                                />
                            </InputGroup>

                            <InputGroup
                                name="Count"
                                label={t("editor:properties.particle-system.burst.count")}
                            >
                                <NumericInput
                                    value={burst.count.value}
                                    onChange={onSetState(burst.count)}
                                />
                            </InputGroup>

                            <InputGroup
                                name="Cycle"
                                label={t("editor:properties.particle-system.burst.cycle")}
                            >
                                <NumericInput
                                    value={burst.cycle.value}
                                    onChange={onSetState(burst.cycle)}
                                />
                            </InputGroup>

                            <InputGroup
                                name="Interval"
                                label={t("editor:properties.particle-system.burst.interval")}
                            >
                                <NumericInput
                                    value={burst.interval.value}
                                    onChange={onSetState(burst.interval)}
                                />
                            </InputGroup>

                            <InputGroup
                                name="Probability"
                                label={t("editor:properties.particle-system.burst.probability")}
                            >
                                <NumericInput
                                    value={burst.probability.value}
                                    onChange={onSetState(burst.probability)}
                                />
                            </InputGroup>

                            <Button onClick={onRemoveBurst(burst)}>Remove Burst</Button>
                        </div>
                    );
                }}
            />
            {particleSystem.systemParameters.shape.type === "mesh_surface" && (
                <InputGroup
                    name="Shape Mesh"
                    label={t("editor:properties.particle-system.shape-mesh")}
                >
                    <ModelInput
                        value={particleSystem.systemParameters.shape.mesh}
                        onChange={onChangeShapeParm("mesh")}
                    />
                </InputGroup>
            )}
            {particleSystem.systemParameters.shape.type !== "mesh_surface" && (
                <ParameterInput
                    entity={`${entity}-shape`}
                    values={particleSystem.systemParameters.shape}
                    onChange={onChangeShapeParm}
                />
            )}

            <InputGroup name="Start Life" label={t("editor:properties.particle-system.start-life")}>
                <ValueGenerator
                    value={particleSystem.systemParameters.startLife}
                    scope={particleSystemState.systemParameters.startLife}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup name="Start Size" label={t("editor:properties.particle-system.start-size")}>
                <ValueGenerator
                    value={particleSystem.systemParameters.startSize}
                    scope={particleSystemState.systemParameters.startSize}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup
                name="Start Speed"
                label={t("editor:properties.particle-system.start-speed")}
            >
                <ValueGenerator
                    value={particleSystem.systemParameters.startSpeed}
                    scope={particleSystemState.systemParameters.startSpeed}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup
                name="Start Rotation"
                label={t("editor:properties.particle-system.start-rotation")}
            >
                <ValueGenerator
                    value={particleSystem.systemParameters.startRotation}
                    scope={particleSystemState.systemParameters.startRotation}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup
                name="Start Color"
                label={t("editor:properties.particle-system.start-color")}
            >
                <ColorGenerator
                    scope={particleSystemState.systemParameters.startColor}
                    value={particleSystem.systemParameters.startColor}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup
                name="Emission Over Time"
                label={t("editor:properties.particle-system.emission-over-time")}
            >
                <ValueGenerator
                    value={particleSystem.systemParameters.emissionOverTime}
                    scope={particleSystemState.systemParameters.emissionOverTime}
                    onChange={onSetState}
                />
            </InputGroup>
            <InputGroup
                name="Render Mode"
                label={t("editor:properties.particle-system.render-mode")}
            >
                <SelectInput
                    value={particleSystem.systemParameters.renderMode}
                    onChange={onSetSystemParm("renderMode")}
                    options={[
                        { label: "Billboard", value: RenderMode.BillBoard },
                        { label: "Stretched Billboard", value: RenderMode.StretchedBillBoard },
                        { label: "Mesh", value: RenderMode.Mesh },
                        { label: "Trail", value: RenderMode.Trail },
                    ]}
                />
            </InputGroup>
            {particleSystem.systemParameters.renderMode === RenderMode.Trail && (
                <>
                    <InputGroup
                        name="Trail Length"
                        label={t("editor:properties.particle-system.trail-length")}
                    >
                        <ValueGenerator
                            value={
                                particleSystem.systemParameters.rendererEmitterSettings.startLength
                            }
                            scope={
                                particleSystemState.systemParameters.rendererEmitterSettings
                                    .startLength
                            }
                            onChange={onSetState}
                        />
                    </InputGroup>
                    <InputGroup
                        name="Follow Local Origin"
                        label={t("editor:properties.particle-system.follow-local-origin")}
                    >
                        <BooleanInput
                            value={
                                particleSystem.systemParameters.rendererEmitterSettings
                                    .followLocalOrigin
                            }
                            onChange={onSetState(
                                particleSystemState.systemParameters.rendererEmitterSettings
                                    .followLocalOrigin,
                            )}
                        />
                    </InputGroup>
                </>
            )}
            <InputGroup name="Texture" label={t("editor:properties.particle-system.texture")}>
                <TexturePreviewInput
                    value={particleSystem.systemParameters.texture ?? ""}
                    onRelease={onSetSystemParm("texture")}
                />
            </InputGroup>
            <InputGroup name="U Tiles" label={t("editor:properties.particle-system.u-tiles")}>
                <NumericInput
                    value={particleSystem.systemParameters.uTileCount}
                    onChange={onSetSystemParm("uTileCount")}
                />
            </InputGroup>
            <InputGroup name="V Tiles" label={t("editor:properties.particle-system.v-tiles")}>
                <NumericInput
                    value={particleSystem.systemParameters.vTileCount}
                    onChange={onSetSystemParm("vTileCount")}
                />
            </InputGroup>
            <InputGroup
                name="Start Tile Index"
                label={t("editor:properties.particle-system.start-tile-index")}
            >
                {typeof particleSystem.systemParameters.startTileIndex === "number" && (
                    <>
                        <NumericInput
                            value={particleSystem.systemParameters.startTileIndex}
                            onChange={onSetState(
                                particleSystemState.systemParameters.startTileIndex,
                            )}
                        />
                        <Button
                            onClick={() => {
                                const nuParms = JSON.parse(
                                    JSON.stringify(particleSystem.systemParameters),
                                );
                                nuParms.startTileIndex = {
                                    type: "ConstantValue",
                                    value: particleSystem.systemParameters.startTileIndex,
                                };
                                particleSystemState.systemParameters.set(nuParms);
                                commitProperty(
                                    ParticleSystemComponent,
                                    "systemParameters",
                                )(nuParms);
                                particleSystemState._refresh.set(particleSystem._refresh + 1);
                            }}
                        >
                            Convert to Value Generator
                        </Button>
                    </>
                )}
                {typeof particleSystem.systemParameters.startTileIndex === "object" && (
                    <ValueGenerator
                        scope={particleSystemState.systemParameters.startTileIndex}
                        value={particleSystem.systemParameters.startTileIndex}
                        onChange={onSetState}
                    />
                )}
            </InputGroup>

            <InputGroup name="Mesh" label={t("editor:properties.particle-system.mesh")}>
                <ModelInput
                    value={particleSystem.systemParameters.instancingGeometry}
                    onRelease={onSetState(particleSystemState.systemParameters.instancingGeometry)}
                />
            </InputGroup>
            <InputGroup name="Blending" label={t("editor:properties.particle-system.blending")}>
                <SelectInput
                    value={particleSystem.systemParameters.blending}
                    onChange={onSetState(particleSystemState.systemParameters.blending)}
                    options={[
                        { label: "Normal", value: NormalBlending },
                        { label: "Additive", value: AdditiveBlending },
                        { label: "Subtractive", value: SubtractiveBlending },
                        { label: "Multiply", value: MultiplyBlending },
                        { label: "Custom", value: CustomBlending },
                        { label: "No Blending", value: NoBlending },
                    ]}
                />
            </InputGroup>
            <InputGroup
                name="Transparent"
                label={t("editor:properties.particle-system.transparent")}
            >
                <BooleanInput
                    value={particleSystem.systemParameters.transparent ?? false}
                    onChange={onSetState(particleSystemState.systemParameters.transparent)}
                />
            </InputGroup>
            <InputGroup
                name="World Space"
                label={t("editor:properties.particle-system.world-space")}
            >
                <BooleanInput
                    value={particleSystem.systemParameters.worldSpace}
                    onChange={onSetSystemParm("worldSpace")}
                />
            </InputGroup>
            <Button className="self-end" onClick={onAddBehavior}>
                {t("editor:properties.particle-system.addBehavior")}
            </Button>
            <PaginatedList
                list={particleSystemState.behaviorParameters}
                element={behaviorState => {
                    return (
                        <>
                            <BehaviorInput
                                scope={behaviorState}
                                value={behaviorState.value}
                                onChange={onSetState}
                            />
                            <Button onClick={onRemoveBehavior(behaviorState.value)}>Remove</Button>
                        </>
                    );
                }}
            />
        </NodeEditor>
    );
};

ParticleSystemNodeEditor.iconComponent = HiSparkles;

export default ParticleSystemNodeEditor;
