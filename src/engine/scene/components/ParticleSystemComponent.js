import { useEffect } from "react";
import { AdditiveBlending, DoubleSide, MeshBasicMaterial } from "three";
import { BatchedRenderer, BehaviorFromJSON, ParticleSystem, RenderMode } from "three.quarks";
import matches from "ts-matches";

import { UUIDComponent } from "../../../ecs";
import {
    defineComponent,
    getComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import {
    createEntity,
    generateEntityUUID,
    removeEntity,
    useEntityContext,
} from "../../../ecs/EntityFunctions";
import {
    NO_PROXY,
    defineState,
    dispatchAction,
    getMutableState,
    getState,
    none,
    useHookstate,
} from "../../../hyperflux";
import { NameComponent } from "../../../spatial/common/NameComponent";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { useDisposable } from "../../../spatial/resources/resourceHooks";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { AssetType } from "../../../common/src/constants/AssetType";
import { AssetLoader } from "../../assets/classes/AssetLoader";
import { useGLTF, useTexture } from "../../assets/functions/resourceLoaderHooks";
import { GLTFComponent } from "../../gltf/GLTFComponent";
import { GLTFSnapshotAction } from "../../gltf/GLTFDocumentState";
import { GLTFSnapshotState, GLTFSourceState } from "../../gltf/GLTFState";
import getFirstMesh from "../util/meshUtils";
import { SourceComponent } from "./SourceComponent";

const createBatchedRenderer = sceneID => {
    const particleState = getMutableState(ParticleState);
    if (particleState.renderers[sceneID].value) {
        const instance = particleState.renderers[sceneID].get(NO_PROXY);
        instance.instanceCount++;
        return instance;
    } else {
        const renderer = new BatchedRenderer();
        const rendererEntity = createEntity();
        setComponent(rendererEntity, UUIDComponent, generateEntityUUID());
        setComponent(rendererEntity, VisibleComponent);
        setComponent(rendererEntity, NameComponent, "Particle Renderer");
        const sourceState = getState(GLTFSourceState);
        setComponent(rendererEntity, EntityTreeComponent, { parentEntity: sourceState[sceneID] });
        addObjectToGroup(rendererEntity, renderer);
        renderer.parent = {
            type: "Scene",
            remove: () => {},
            removeFromParent: () => {},
        };
        const instance = { renderer, rendererEntity, instanceCount: 1 };
        particleState.renderers[sceneID].set(instance);
        return instance;
    }
};

const removeBatchedRenderer = sceneID => {
    const particleState = getMutableState(ParticleState);
    if (particleState.renderers[sceneID].value) {
        const instance = particleState.renderers[sceneID].get(NO_PROXY);
        if (instance.instanceCount <= 1) {
            removeObjectFromGroup(instance.rendererEntity, instance.renderer);
            for (const batch of instance.renderer.batches) {
                batch.geometry.dispose();
                batch.dispose();
            }
            removeEntity(instance.rendererEntity);
            particleState.renderers[sceneID].set(none);
        } else {
            instance.instanceCount--;
        }
    }
};

export const ParticleState = defineState({
    name: "ParticleState",
    initial: () => ({
        renderers: {},
    }),
});

export const SPHERE_SHAPE_DEFAULT = {
    type: "sphere",
    radius: 1,
};

export const POINT_SHAPE_DEFAULT = {
    type: "point",
};

export const CONE_SHAPE_DEFAULT = {
    type: "cone",
    radius: 1,
    arc: 0.2,
    thickness: 4,
    angle: 30,
};

export const DONUT_SHAPE_DEFAULT = {
    type: "donut",
    radius: 1,
    arc: 30,
    thickness: 0.5,
    angle: 15,
};

export const MESH_SHAPE_DEFAULT = {
    type: "mesh_surface",
    mesh: "",
};

export const GRID_SHAPE_DEFAULT = {
    type: "grid",
    width: 1,
    height: 1,
    column: 1,
    row: 1,
};

export const ValueGeneratorJSONDefaults = {
    ConstantValue: {
        type: "ConstantValue",
        value: 1,
    },
    IntervalValue: {
        type: "IntervalValue",
        a: 0,
        b: 1,
    },
    PiecewiseBezier: {
        type: "PiecewiseBezier",
        functions: [
            {
                function: {
                    p0: 0,
                    p1: 0,
                    p2: 1,
                    p3: 1,
                },
                start: 0,
            },
        ],
    },
};

export const ColorGeneratorJSONDefaults = {
    ConstantColor: {
        type: "ConstantColor",
        color: { r: 1, g: 1, b: 1, a: 1 },
    },
    ColorRange: {
        type: "ColorRange",
        a: { r: 1, g: 1, b: 1, a: 1 },
        b: { r: 1, g: 1, b: 1, a: 1 },
    },
    RandomColor: {
        type: "RandomColor",
        a: { r: 1, g: 1, b: 1, a: 1 },
        b: { r: 1, g: 1, b: 1, a: 1 },
    },
    Gradient: {
        type: "Gradient",
        functions: [
            {
                function: {
                    type: "ColorRange",
                    a: { r: 1, g: 1, b: 1, a: 1 },
                    b: { r: 1, g: 1, b: 1, a: 1 },
                },
                start: 0,
            },
        ],
    },
};

export const RotationGeneratorJSONDefaults = {
    AxisAngle: {
        type: "AxisAngle",
        axis: [0, 1, 0],
        angle: {
            type: "ConstantValue",
            value: 0,
        },
    },
    Euler: {
        type: "Euler",
        angleX: {
            type: "ConstantValue",
            value: 0,
        },
        angleY: {
            type: "ConstantValue",
            value: 0,
        },
        angleZ: {
            type: "ConstantValue",
            value: 0,
        },
    },
    RandomQuat: {
        type: "RandomQuat",
    },
};

export const BehaviorJSONDefaults = {
    ApplySequences: {
        type: "ApplySequences",
        delay: 0,
        sequencers: [],
    },
    ApplyForce: {
        type: "ApplyForce",
        direction: [0, 1, 0],
        magnitude: {
            type: "ConstantValue",
            value: 1,
        },
    },
    Noise: {
        type: "Noise",
        frequency: [1, 1, 1],
        power: [1, 1, 1],
    },
    TurbulenceField: {
        type: "TurbulenceField",
        scale: [1, 1, 1],
        octaves: 3,
        velocityMultiplier: [1, 1, 1],
        timeScale: [1, 1, 1],
    },
    GravityForce: {
        type: "GravityForce",
        center: [0, 0, 0],
        magnitude: 1,
    },
    ColorOverLife: {
        type: "ColorOverLife",
        color: {
            type: "ConstantColor",
            color: {
                r: 1,
                g: 1,
                b: 1,
                a: 1,
            },
        },
    },
    RotationOverLife: {
        type: "RotationOverLife",
        angularVelocity: {
            type: "ConstantValue",
            value: 0.15,
        },
        dynamic: false,
    },
    Rotation3DOverLife: {
        type: "Rotation3DOverLife",
        angularVelocity: {
            type: "RandomQuat",
        },
        dynamic: false,
    },
    SizeOverLife: {
        type: "SizeOverLife",
        size: {
            type: "ConstantValue",
            value: 0,
        },
    },
    SpeedOverLife: {
        type: "SpeedOverLife",
        speed: {
            type: "ConstantValue",
            value: 1,
        },
    },
    FrameOverLife: {
        type: "FrameOverLife",
        frame: {
            type: "ConstantValue",
            value: 0,
        },
    },
    ForceOverLife: {
        type: "ForceOverLife",
        x: {
            type: "ConstantValue",
            value: 0,
        },
        y: {
            type: "ConstantValue",
            value: 1,
        },
        z: {
            type: "ConstantValue",
            value: 0,
        },
    },
    OrbitOverLife: {
        type: "OrbitOverLife",
        orbitSpeed: {
            type: "ConstantValue",
            value: 0,
        },
        axis: [0, 1, 0],
    },
    WidthOverLength: {
        type: "WidthOverLength",
        width: {
            type: "ConstantValue",
            value: 1,
        },
    },
    ChangeEmitDirection: {
        type: "ChangeEmitDirection",
        angle: {
            type: "ConstantValue",
            value: 1.4,
        },
    },
    EmitSubParticleSystem: {
        type: "EmitSubParticleSystem",
        subParticleSystem: "",
        useVelocityAsBasis: false,
    },
};

export const ParticleSystemJSONParametersValidator = matches.shape({
    version: matches.string,
    autoDestroy: matches.boolean,
    looping: matches.boolean,
    duration: matches.number,
    shape: matches.shape({
        type: matches.string,
        radius: matches.number.optional(),
        arc: matches.number.optional(),
        thickness: matches.number.optional(),
        angle: matches.number.optional(),
        mesh: matches.string.optional(),
    }),
    startLife: matches.object,
    startSpeed: matches.object,
    startRotation: matches.object,
    startSize: matches.object,
    startColor: matches.object,
    emissionOverTime: matches.object,
    emissionOverDistance: matches.object,
    onlyUsedByOther: matches.boolean,
    rendererEmitterSettings: matches
        .shape({
            startLength: matches.object.optional(),
            followLocalOrigin: matches.boolean.optional(),
        })
        .optional(),
    renderMode: matches.natural,
    speedFactor: matches.number,
    texture: matches.string,
    instancingGeometry: matches.object.optional(),
    startTileIndex: matches.natural,
    uTileCount: matches.natural,
    vTileCount: matches.natural,
    blending: matches.natural,
    behaviors: matches.arrayOf(matches.any),
    worldSpace: matches.boolean,
});

export const DEFAULT_PARTICLE_SYSTEM_PARAMETERS = {
    version: "1.0",
    autoDestroy: false,
    looping: true,
    prewarm: false,
    material: "",
    duration: 5,
    shape: { type: "point" },
    startLife: {
        type: "IntervalValue",
        a: 1,
        b: 2,
    },
    startSpeed: {
        type: "IntervalValue",
        a: 0.1,
        b: 5,
    },
    startRotation: {
        type: "IntervalValue",
        a: 0,
        b: 300,
    },
    startSize: {
        type: "IntervalValue",
        a: 0.025,
        b: 0.45,
    },
    startColor: {
        type: "ConstantColor",
        color: { r: 1, g: 1, b: 1, a: 0.1 },
    },
    emissionOverTime: {
        type: "ConstantValue",
        value: 400,
    },
    emissionOverDistance: {
        type: "ConstantValue",
        value: 0,
    },
    emissionBursts: [],
    onlyUsedByOther: false,
    rendererEmitterSettings: {
        startLength: {
            type: "ConstantValue",
            value: 1,
        },
        followLocalOrigin: true,
    },
    renderMode: RenderMode.BillBoard,
    texture: "/static/editor/dot.png",
    instancingGeometry: "",
    startTileIndex: {
        type: "ConstantValue",
        value: 0,
    },
    uTileCount: 1,
    vTileCount: 1,
    blending: AdditiveBlending,
    behaviors: [],
    worldSpace: true,
};

export const ParticleSystemComponent = defineComponent({
    name: "ParticleSystemComponent",
    jsonID: "EE_particle_system",

    onInit: _entity => {
        return {
            systemParameters: DEFAULT_PARTICLE_SYSTEM_PARAMETERS,
            behaviorParameters: [],
            behaviors,
            _loadIndex: 0,
            _refresh: 0,
        };
    },

    onSet: (_entity, component, json) => {
        !!json?.systemParameters &&
            component.systemParameters.set({
                ...JSON.parse(JSON.stringify(component.systemParameters.value)),
                ...json.systemParameters,
            });

        !!json?.behaviorParameters &&
            component.behaviorParameters.set(JSON.parse(JSON.stringify(json.behaviorParameters)));
        (!!json?.systemParameters || !!json?.behaviorParameters) &&
            component._refresh.set((component._refresh.value + 1) % 1000);
    },

    toJSON: (_entity, component) => ({
        systemParameters: JSON.parse(JSON.stringify(component.systemParameters.value)),
        behaviorParameters: JSON.parse(JSON.stringify(component.behaviorParameters.value)),
    }),

    reactor: function () {
        const entity = useEntityContext();
        const componentState = useComponent(entity, ParticleSystemComponent);
        const metadata = useHookstate({ textures: {}, geometries: {}, materials: {} });
        const sceneID = useOptionalComponent(entity, SourceComponent)?.value;
        const rootEntity = useHookstate(getMutableState(GLTFSourceState))[sceneID ?? ""].value;
        const sceneLoaded = GLTFComponent.useSceneLoaded(rootEntity);
        const refreshed = useHookstate(false);

        const [geoDependency] = useGLTF(
            componentState.value.systemParameters.instancingGeometry,
            entity,
            url => {
                metadata.geometries.nested(url).set(none);
            },
        );
        const [shapeMesh] = useGLTF(
            componentState.value.systemParameters.shape.mesh,
            entity,
            url => {
                metadata.geometries.nested(url).set(none);
            },
        );
        const [texture] = useTexture(componentState.value.systemParameters.texture, entity, url => {
            metadata.textures.nested(url).set(none);
            dudMaterial.map = null;
        });

        const [dudMaterial] = useDisposable(MeshBasicMaterial, entity, {
            color: 0xffffff,
            transparent: componentState.value.systemParameters.transparent ?? true,
            blending: componentState.value.systemParameters.blending,
            side: DoubleSide,
        });
        //@todo: this is a hack to make trail rendering mode work correctly. We need to find out why an additional snapshot is needed
        useEffect(() => {
            if (!sceneLoaded) return;
            if (refreshed.value) return;

            //if (componentState.systemParameters.renderMode.value === RenderMode.Trail) {
            const snapshot = GLTFSnapshotState.cloneCurrentSnapshot(sceneID);
            dispatchAction(GLTFSnapshotAction.createSnapshot(snapshot));
            //}
            refreshed.set(true);
        }, [sceneLoaded]);

        useEffect(() => {
            //add dud material
            componentState.systemParameters.material.set("dud");
            metadata.materials.nested("dud").set(dudMaterial);
        }, []);

        useEffect(() => {
            if (!geoDependency || !geoDependency.scene) return;

            const scene = geoDependency.scene;
            const geo = getFirstMesh(scene)?.geometry;
            !!geo &&
                metadata.geometries
                    .nested(componentState.value.systemParameters.instancingGeometry)
                    .set(geo);
        }, [geoDependency]);

        useEffect(() => {
            if (!shapeMesh || !shapeMesh.scene) return;

            const scene = shapeMesh.scene;
            const mesh = getFirstMesh(scene);
            mesh &&
                metadata.geometries
                    .nested(componentState.value.systemParameters.shape.mesh)
                    .set(mesh.geometry);
        }, [shapeMesh]);

        useEffect(() => {
            if (!texture) return;
            metadata.textures.nested(componentState.value.systemParameters.texture).set(texture);
            dudMaterial.map = texture;
            dudMaterial.needsUpdate = true;
        }, [texture]);

        useEffect(() => {
            // loadIndex of 0 means particle system dependencies haven't loaded yet
            if (!componentState._loadIndex.value) return;

            const component = componentState.get(NO_PROXY);
            const rendererInstance = createBatchedRenderer(sceneID);
            const renderer = rendererInstance.renderer;

            const systemParameters = JSON.parse(JSON.stringify(component.systemParameters));
            const nuSystem = ParticleSystem.fromJSON(systemParameters, metadata.value, {});
            renderer.addSystem(nuSystem);
            const behaviors = component.behaviorParameters.map(behaviorJSON => {
                const behavior = BehaviorFromJSON(behaviorJSON, nuSystem);
                nuSystem.addBehavior(behavior);
                return behavior;
            });
            componentState.behaviors.set(behaviors);

            const emitterAsObj3D = nuSystem.emitter;
            emitterAsObj3D.userData["_refresh"] = component._refresh;
            addObjectToGroup(entity, emitterAsObj3D);
            emitterAsObj3D.parent = renderer;
            const transformComponent = getComponent(entity, TransformComponent);
            emitterAsObj3D.matrix = transformComponent.matrix;
            componentState.system.set(nuSystem);

            return () => {
                const index = renderer.systemToBatchIndex.get(nuSystem);
                if (typeof index !== "undefined") {
                    renderer.deleteSystem(nuSystem);
                    renderer.children.splice(index, 1);
                    const [batch] = renderer.batches.splice(index, 1);
                    batch.dispose();
                    renderer.systemToBatchIndex.clear();
                    for (let i = 0; i < renderer.batches.length; i++) {
                        for (const system of renderer.batches[i].systems) {
                            renderer.systemToBatchIndex.set(system, i);
                        }
                    }
                }
                removeObjectFromGroup(entity, emitterAsObj3D);
                nuSystem.dispose();
                emitterAsObj3D.dispose();
                removeBatchedRenderer(sceneID);
            };
        }, [componentState._loadIndex]);

        useEffect(() => {
            const component = componentState.value;

            const doLoadEmissionGeo =
                component.systemParameters.shape.type === "mesh_surface" &&
                AssetLoader.getAssetClass(component.systemParameters.shape.mesh ?? "") ===
                    AssetType.Model;

            const doLoadInstancingGeo =
                component.systemParameters.instancingGeometry &&
                AssetLoader.getAssetClass(component.systemParameters.instancingGeometry) ===
                    AssetType.Model;

            const doLoadTexture =
                component.systemParameters.texture &&
                AssetLoader.getAssetClass(component.systemParameters.texture) === AssetType.Image;

            const loadedEmissionGeo = (doLoadEmissionGeo && shapeMesh) || !doLoadEmissionGeo;
            const loadedInstanceGeo =
                (doLoadInstancingGeo && geoDependency) || !doLoadInstancingGeo;
            const loadedTexture = (doLoadTexture && texture) || !doLoadTexture;

            if (loadedEmissionGeo && loadedInstanceGeo && loadedTexture) {
                componentState._loadIndex.set(componentState._loadIndex.value + 1);
            }
        }, [geoDependency, shapeMesh, texture, componentState._refresh]);

        return null;
    },
});
