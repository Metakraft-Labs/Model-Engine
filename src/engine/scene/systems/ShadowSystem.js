import React, { useEffect } from "react";
import {
    Box3,
    DoubleSide,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Quaternion,
    Raycaster,
    Sphere,
    Vector3,
} from "three";

import { AnimationSystemGroup, Engine, UUIDComponent } from "../../../ecs";
import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { UndefinedEntity } from "../../../ecs/Entity";
import { createEntity, removeEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { defineQuery, QueryReactor } from "../../../ecs/QueryFunctions";
import { defineSystem, useExecute } from "../../../ecs/SystemFunctions";
import { defineState, getMutableState, getState, NO_PROXY, useHookstate } from "../../../hyperflux";
import { Vector3_Back } from "../../../spatial/common/constants/MathConstants";
import {
    createPriorityQueue,
    createSortAndApplyPriorityQueue,
} from "../../../spatial/common/functions/PriorityQueue";
import { NameComponent } from "../../../spatial/common/NameComponent";
import {
    addObjectToGroup,
    GroupComponent,
} from "../../../spatial/renderer/components/GroupComponent";
import { DirectionalLightComponent } from "../../../spatial/renderer/components/lights/DirectionalLightComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { ObjectLayerComponents } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { CSM } from "../../../spatial/renderer/csm/CSM";
//import { CSMHelper } from '../../../spatial/renderer/csm/CSMHelper'
import {
    getShadowsEnabled,
    useShadowsEnabled,
} from "../../../spatial/renderer/functions/RenderSettingsFunction";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { compareDistanceToCamera } from "../../../spatial/transform/components/DistanceComponents";
import {
    EntityTreeComponent,
    iterateEntityNode,
    useChildWithComponent,
} from "../../../spatial/transform/components/EntityTree";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";
import { XRLightProbeState } from "../../../spatial/xr/XRLightProbeSystem";
import { isMobileXRHeadset } from "../../../spatial/xr/XRState";

import { TransformSystem } from "../../../spatial";
import { EngineState } from "../../../spatial/EngineState";
import { RenderModes } from "../../../spatial/renderer/constants/RenderModes";
import { createDisposable } from "../../../spatial/resources/resourceHooks";
import { useTexture } from "../../assets/functions/resourceLoaderHooks";
import { DropShadowComponent } from "../components/DropShadowComponent";
import { useHasModelOrIndependentMesh } from "../components/ModelComponent";
import { RenderSettingsComponent } from "../components/RenderSettingsComponent";
import { ShadowComponent } from "../components/ShadowComponent";
import { SceneObjectSystem } from "./SceneObjectSystem";

export const ShadowSystemState = defineState({
    name: "ee.engine.scene.ShadowSystemState",
    initial: () => {
        const accumulationBudget = isMobileXRHeadset ? 4 : 20;

        const priorityQueue = createPriorityQueue({
            accumulationBudget,
        });

        return {
            priorityQueue,
        };
    },
});

export const shadowDirection = new Vector3(0, -1, 0);
const shadowRotation = new Quaternion();
const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const raycasterPosition = new Vector3();

const EntityCSMReactor = props => {
    const { entity, rendererEntity, renderSettingsEntity } = props;
    const rendererComponent = useComponent(rendererEntity, RendererComponent);
    const renderSettingsComponent = useComponent(renderSettingsEntity, RenderSettingsComponent);

    const directionalLightComponent = useComponent(entity, DirectionalLightComponent);
    const shadowMapResolution = useHookstate(getMutableState(RendererState).shadowMapResolution);

    const directionalLight = directionalLightComponent.light.get(NO_PROXY);

    const csm = rendererComponent.csm.get(NO_PROXY);

    useEffect(() => {
        if (!directionalLight) return;
        if (!directionalLightComponent.castShadow.value) return;
        const csm = new CSM({
            light: directionalLight,
            shadowMapSize: shadowMapResolution.value,
            shadowBias: directionalLightComponent.shadowBias.value,
            maxFar: directionalLightComponent.cameraFar.value,
            lightIntensity: directionalLightComponent.intensity.value,
            lightColor: directionalLightComponent.color.value,
            cascades: renderSettingsComponent.cascades.value,
        });
        rendererComponent.csm.set(csm);
        return () => {
            csm.dispose();
            if (!hasComponent(rendererEntity, RendererComponent)) return;
            rendererComponent.csm.set(null);
        };
    }, [directionalLight, directionalLightComponent?.castShadow]);

    /** Must run after scene object system to ensure source light is not lit */
    useExecute(
        () => {
            if (!directionalLight || !directionalLightComponent.castShadow.value) return;
            directionalLight.visible = false;
        },
        { after: SceneObjectSystem },
    );

    useEffect(() => {
        if (!csm) return;
        if (!directionalLight) return;
        if (!directionalLightComponent.castShadow.value) return;

        csm.shadowBias = directionalLight.shadow.bias;
        csm.maxFar = directionalLightComponent.cameraFar.value;
        csm.shadowMapSize = shadowMapResolution.value;

        for (const light of csm.lights) {
            light.color.copy(directionalLightComponent.color.value);
            light.intensity = directionalLightComponent.intensity.value;
            light.shadow.mapSize.setScalar(shadowMapResolution.value);
            light.shadow.radius = directionalLightComponent.shadowRadius.value;
        }
        csm.needsUpdate = true;
    }, [
        rendererComponent.csm,
        shadowMapResolution,
        directionalLight,
        directionalLightComponent.shadowBias,
        directionalLightComponent.intensity,
        directionalLightComponent.color,
        directionalLightComponent.castShadow,
        directionalLightComponent.shadowRadius,
        directionalLightComponent.cameraFar,
    ]);

    useEffect(() => {
        if (!csm) return;
        csm.cascades = renderSettingsComponent.cascades.value;
        csm.needsUpdate = true;
    }, [csm, renderSettingsComponent.cascades]);

    return (
        <QueryReactor
            Components={[ShadowComponent, GroupComponent]}
            ChildEntityReactor={EntityChildCSMReactor}
            props={{ rendererEntity: rendererEntity }}
        />
    );
};

const EntityChildCSMReactor = props => {
    const entity = useEntityContext();
    const { rendererEntity } = props;

    const shadowComponent = useComponent(entity, ShadowComponent);
    const groupComponent = useComponent(entity, GroupComponent);
    const csm = useComponent(rendererEntity, RendererComponent).csm.value;

    useEffect(() => {
        if (!csm || !shadowComponent.receive.value) return;

        if (!groupComponent) return;

        const objs = [...groupComponent.value];
        for (const obj of objs) {
            if (obj.material) {
                csm.setupMaterial(obj);
            }
        }

        return () => {
            for (const obj of objs) {
                if (obj.material) {
                    csm.teardownMaterial(obj.material);
                }
            }
        };
    }, [shadowComponent.receive, csm]);

    return null;
};

function _CSMReactor() {
    const rendererEntity = useEntityContext();
    const renderer = useComponent(rendererEntity, RendererComponent).value;
    /**
     * @todo Currently this will just return the first entity with a RenderSettingsComponent found,
     *   but we need some more advanced rule for determining which entity to use
     *   considering multi-scene support and spatial volumes.
     *   note: use index 0 (origin entity), index 1 is local floor entity,
     */
    const renderSettingsEntity = useChildWithComponent(renderer.scenes[0], RenderSettingsComponent);
    const isEditor = useHookstate(getMutableState(EngineState).isEditor).value;
    const renderMode = useHookstate(getMutableState(RendererState).renderMode).value;

    if (!rendererEntity) return null;
    if (!renderSettingsEntity) return null;
    if ((isEditor && renderMode === RenderModes.UNLIT) || renderMode === RenderModes.LIT)
        return null;

    return (
        <CSMReactor rendererEntity={rendererEntity} renderSettingsEntity={renderSettingsEntity} />
    );
}

function CSMReactor(props) {
    const { rendererEntity, renderSettingsEntity } = props;
    //const rendererComponent = useComponent(rendererEntity, RendererComponent)

    const renderSettingsComponent = useComponent(renderSettingsEntity, RenderSettingsComponent);
    const xrLightProbeEntity = useHookstate(
        getMutableState(XRLightProbeState).directionalLightEntity,
    );
    const activeLightEntity = useHookstate(
        UUIDComponent.getEntityByUUID(renderSettingsComponent.primaryLight.value),
    );
    const directionalLight = useOptionalComponent(
        activeLightEntity.value,
        DirectionalLightComponent,
    );

    //const rendererState = useMutableState(RendererState)

    // useEffect(() => {
    //   if (!rendererComponent) return
    //   if (!rendererComponent.csm.value || !rendererState.nodeHelperVisibility.value) return

    //   const helper = new CSMHelper()
    //   rendererComponent.csmHelper.set(helper)
    //   return () => {
    //     helper.remove()
    //     rendererComponent.csmHelper.set(null)
    //   }
    // }, [rendererComponent, renderSettingsComponent.csm, rendererState.nodeHelperVisibility])

    useEffect(() => {
        if (rendererEntity === Engine.instance.viewerEntity && xrLightProbeEntity.value) {
            activeLightEntity.set(xrLightProbeEntity.value);
            return;
        }

        if (renderSettingsComponent.primaryLight.value) {
            activeLightEntity.set(
                UUIDComponent.getEntityByUUID(renderSettingsComponent.primaryLight.value),
            );
            return;
        }

        activeLightEntity.set(UndefinedEntity);
    }, [xrLightProbeEntity.value, renderSettingsComponent.primaryLight]);

    if (!renderSettingsComponent.csm.value || !activeLightEntity.value || !directionalLight)
        return null;

    return (
        <EntityCSMReactor
            key={activeLightEntity.value}
            entity={activeLightEntity.value}
            rendererEntity={rendererEntity}
            renderSettingsEntity={renderSettingsEntity}
        />
    );
}

const shadowGeometry = new PlaneGeometry(1, 1, 1, 1).rotateX(-Math.PI);
const shadowMaterial = new MeshBasicMaterial({
    side: DoubleSide,
    transparent: true,
    opacity: 1,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: 0.01,
});

const dropShadowComponentQuery = defineQuery([DropShadowComponent]);

const minRadius = 0.15;
const maxRadius = 5;
const sphere = new Sphere();
const box3 = new Box3();
const vec3 = new Vector3();

const DropShadowReactor = () => {
    const entity = useEntityContext();
    const hasMeshOrModel = useHasModelOrIndependentMesh(entity);
    const shadow = useComponent(entity, ShadowComponent);

    useEffect(() => {
        if (!shadow.cast.value || !hasMeshOrModel || hasComponent(entity, DropShadowComponent))
            return;

        box3.makeEmpty();

        let foundMesh = false;

        iterateEntityNode(entity, child => {
            const mesh = getOptionalComponent(child, MeshComponent);
            if (mesh) {
                box3.expandByObject(mesh);
                foundMesh = true;
            }
        });

        if (!foundMesh) return;

        box3.getBoundingSphere(sphere);

        if (sphere.radius > maxRadius) return;

        const radius = Math.max(sphere.radius * 2, minRadius);
        const center = sphere.center.sub(TransformComponent.getWorldPosition(entity, vec3));
        const shadowEntity = createEntity();
        const [shadowObject, unload] = createDisposable(
            Mesh,
            shadowEntity,
            shadowGeometry.clone(),
            shadowMaterial.clone(),
        );
        addObjectToGroup(shadowEntity, shadowObject);
        setComponent(shadowEntity, EntityTreeComponent, {
            parentEntity: Engine.instance.originEntity,
        });
        setComponent(
            shadowEntity,
            NameComponent,
            "Shadow for " +
                getComponent(entity, NameComponent) +
                "_" +
                getComponent(entity, UUIDComponent),
        );
        setComponent(shadowEntity, VisibleComponent);
        setComponent(shadowEntity, ObjectLayerComponents[ObjectLayers.Scene]);
        setComponent(entity, DropShadowComponent, { radius, center, entity: shadowEntity });

        return () => {
            removeComponent(entity, DropShadowComponent);
            removeEntity(shadowEntity);
            unload();
        };
    }, [hasMeshOrModel, shadow]);

    return null;
};

const shadowOffset = new Vector3(0, 0.01, 0);

const sortAndApplyPriorityQueue = createSortAndApplyPriorityQueue(
    dropShadowComponentQuery,
    compareDistanceToCamera,
);
const sortedEntityTransforms = [];

const cameraLayerQuery = defineQuery([ObjectLayerComponents[ObjectLayers.Scene], MeshComponent]);
const updateDropShadowTransforms = () => {
    const { deltaSeconds } = getState(ECSState);
    const { priorityQueue } = getState(ShadowSystemState);

    sortAndApplyPriorityQueue(priorityQueue, sortedEntityTransforms, deltaSeconds);

    const sceneObjects = cameraLayerQuery().flatMap(entity => getComponent(entity, MeshComponent));

    for (const entity of priorityQueue.priorityEntities) {
        const dropShadow = getComponent(entity, DropShadowComponent);
        const dropShadowTransform = getComponent(dropShadow.entity, TransformComponent);

        TransformComponent.getWorldPosition(entity, raycasterPosition).add(dropShadow.center);
        raycaster.set(raycasterPosition, shadowDirection);

        const intersected = raycaster.intersectObjects(sceneObjects, false)[0];
        if (!intersected || !intersected.face) {
            dropShadowTransform.scale.setScalar(0);
            continue;
        }

        const centerCorrectedDist = Math.max(intersected.distance - dropShadow.center.y, 0.0001);

        //arbitrary bias to make it a bit smaller
        const sizeBias = 0.3;
        const finalRadius =
            sizeBias * dropShadow.radius + dropShadow.radius * centerCorrectedDist * 0.5;

        const shadowMaterial = getComponent(dropShadow.entity, GroupComponent)[0].material;
        shadowMaterial.opacity = Math.min(1 / (1 + centerCorrectedDist), 1) * 1.2;
        shadowRotation.setFromUnitVectors(intersected.face.normal, Vector3_Back);
        dropShadowTransform.rotation.copy(shadowRotation);
        dropShadowTransform.scale.setScalar(finalRadius * 2);
        dropShadowTransform.position.copy(intersected.point).add(shadowOffset);
    }
};

const rendererQuery = defineQuery([RendererComponent]);

const execute = () => {
    const useShadows = getShadowsEnabled();
    if (!useShadows) return;

    for (const entity of rendererQuery()) {
        const { csm, csmHelper } = getComponent(entity, RendererComponent);
        if (csm) {
            csm.update();
            //if (csmHelper) csmHelper.update(csm)
        }
    }
};

const RendererShadowReactor = () => {
    const entity = useEntityContext();
    const useShadows = useShadowsEnabled();
    const rendererComponent = useComponent(entity, RendererComponent);

    useEffect(() => {
        const renderer = getComponent(entity, RendererComponent).renderer;
        if (!renderer) return;
        renderer.shadowMap.enabled = renderer.shadowMap.autoUpdate = useShadows;
    }, [useShadows, rendererComponent.renderer]);

    return null;
};

const reactor = () => {
    const useShadows = useShadowsEnabled();

    const [shadowTexture] = useTexture(`/projects/spark/default-project/assets/drop-shadow.png`);

    useEffect(() => {
        if (!shadowTexture) return;
        shadowMaterial.map = shadowTexture;
        shadowMaterial.needsUpdate = true;
    }, [shadowTexture]);

    return (
        <>
            {useShadows ? (
                <QueryReactor Components={[RendererComponent]} ChildEntityReactor={_CSMReactor} />
            ) : shadowTexture ? (
                <QueryReactor
                    Components={[VisibleComponent, ShadowComponent]}
                    ChildEntityReactor={DropShadowReactor}
                />
            ) : null}
            <QueryReactor
                Components={[RendererComponent]}
                ChildEntityReactor={RendererShadowReactor}
            />
        </>
    );
};

export const ShadowSystem = defineSystem({
    uuid: "ee.engine.ShadowSystem",
    insert: { with: AnimationSystemGroup },
    execute,
    reactor,
});

export const DropShadowSystem = defineSystem({
    uuid: "ee.engine.DropShadowSystem",
    insert: { after: TransformSystem },
    execute: () => {
        const useShadows = getShadowsEnabled();
        if (!useShadows) {
            updateDropShadowTransforms();
        }
    },
});
