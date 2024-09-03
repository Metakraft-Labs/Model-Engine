import React, { useEffect } from "react";
import {
    MeshLambertMaterial,
    MeshPhongMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
} from "three";

import { entityExists, useEntityContext, UUIDComponent } from "../../../ecs";
import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    serializeComponent,
    setComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";
import { ECSState } from "../../../ecs/ECSState";
import { defineQuery, QueryReactor } from "../../../ecs/QueryFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { AnimationSystemGroup } from "../../../ecs/SystemGroups";
import { getMutableState, getState, useHookstate, useImmediateEffect } from "../../../hyperflux";
import { CallbackComponent } from "../../../spatial/common/CallbackComponent";
import { ColliderComponent } from "../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../spatial/physics/components/RigidBodyComponent";
import { ThreeToPhysics } from "../../../spatial/physics/types/PhysicsTypes";
import {
    GroupComponent,
    GroupQueryReactor,
} from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { ResourceManager } from "../../../spatial/resources/ResourceState";
import {
    DistanceFromCameraComponent,
    FrustumCullCameraComponent,
} from "../../../spatial/transform/components/DistanceComponents";
import { isMobileXRHeadset } from "../../../spatial/xr/XRState";

import {
    MaterialInstanceComponent,
    MaterialStateComponent,
} from "../../../spatial/renderer/materials/MaterialComponent";
import { createAndAssignMaterial } from "../../../spatial/renderer/materials/materialFunctions";
import { EnvmapComponent } from "../components/EnvmapComponent";
import { ModelComponent } from "../components/ModelComponent";
import { ShadowComponent } from "../components/ShadowComponent";
import { SourceComponent } from "../components/SourceComponent";
import { UpdatableCallback, UpdatableComponent } from "../components/UpdatableComponent";
import { getModelSceneID, useModelSceneID } from "../functions/loaders/ModelFunctions";

const disposeMaterial = material => {
    for (const [key, val] of Object.entries(material)) {
        if (val && typeof val.dispose === "function") {
            val.dispose();
        }
    }
    material.dispose();
};

export const disposeObject3D = obj => {
    const mesh = obj;
    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(disposeMaterial);
        } else {
            disposeMaterial(mesh.material);
        }
    }

    if (mesh.geometry) {
        mesh.geometry.dispose();
        for (const key in mesh.geometry.attributes) {
            mesh.geometry.deleteAttribute(key);
        }
    }

    const skinnedMesh = obj;
    if (skinnedMesh.isSkinnedMesh) {
        skinnedMesh.skeleton?.dispose();
    }

    const light = obj; // anything with dispose function
    if (typeof light.dispose === "function") light.dispose();
};

export const ExpensiveMaterials = new Set([
    MeshPhongMaterial,
    MeshStandardMaterial,
    MeshPhysicalMaterial,
]);
/**@todo refactor this to use preprocessor directives instead of new cloned materials with different shaders */
export function setupObject(obj, entity, forceBasicMaterials = false) {
    const child = obj;
    if (child.material) {
        const shouldMakeBasic =
            (forceBasicMaterials || isMobileXRHeadset) &&
            ExpensiveMaterials.has(child.material.constructor);
        if (shouldMakeBasic) {
            const basicUUID = `basic-${child.material.uuid}`;
            const basicMaterialEntity = UUIDComponent.getEntityByUUID(basicUUID);
            if (basicMaterialEntity) {
                child.material = getComponent(basicMaterialEntity, MaterialStateComponent).material;
                return;
            }
            const prevMaterial = child.material;
            const onlyEmmisive = prevMaterial.emissiveMap && !prevMaterial.map;
            const newBasicMaterial = new MeshLambertMaterial().copy(prevMaterial);
            newBasicMaterial.specularMap =
                prevMaterial.roughnessMap ?? prevMaterial.specularIntensityMap;
            if (onlyEmmisive) newBasicMaterial.emissiveMap = prevMaterial.emissiveMap;
            else newBasicMaterial.map = prevMaterial.map;
            newBasicMaterial.reflectivity = prevMaterial.metalness;
            newBasicMaterial.envMap = prevMaterial.envMap;
            newBasicMaterial.uuid = basicUUID;
            newBasicMaterial.alphaTest = prevMaterial.alphaTest;
            newBasicMaterial.side = prevMaterial.side;
            newBasicMaterial.plugins = undefined;

            createAndAssignMaterial(entity, newBasicMaterial);
            setComponent(entity, MaterialInstanceComponent, { uuid: [basicUUID] });
        } else {
            const UUID = child.material.uuid;
            const basicMaterialEntity = UUIDComponent.getEntityByUUID(UUID);
            if (!basicMaterialEntity) return;

            const nonBasicUUID = UUID.slice(6);
            const materialEntity = UUIDComponent.getEntityByUUID(nonBasicUUID);
            if (!materialEntity) return;

            setComponent(entity, MaterialInstanceComponent, { uuid: [nonBasicUUID] });
        }
    }
}

const groupQuery = defineQuery([GroupComponent]);
const updatableQuery = defineQuery([UpdatableComponent, CallbackComponent]);

function SceneObjectReactor(props) {
    const { entity, obj } = props;

    const renderState = getMutableState(RendererState);
    const forceBasicMaterials = useHookstate(renderState.forceBasicMaterials);

    useImmediateEffect(() => {
        setComponent(entity, DistanceFromCameraComponent);
        return () => {
            if (entityExists(entity)) removeComponent(entity, DistanceFromCameraComponent);
        };
    }, []);

    useEffect(() => {
        const source = hasComponent(entity, ModelComponent)
            ? getModelSceneID(entity)
            : getOptionalComponent(entity, SourceComponent);
        return () => {
            ResourceManager.unloadObj(obj, source);
        };
    }, []);

    useEffect(() => {
        setupObject(obj, entity, forceBasicMaterials.value);
    }, [forceBasicMaterials]);

    return null;
}

const minimumFrustumCullDistanceSqr = 5 * 5; // 5 units

const execute = () => {
    const delta = getState(ECSState).deltaSeconds;
    for (const entity of updatableQuery()) {
        const callbacks = getComponent(entity, CallbackComponent);
        callbacks.get(UpdatableCallback)?.(delta);
    }

    for (const entity of groupQuery()) {
        const group = getComponent(entity, GroupComponent);
        /**
         * do frustum culling here, but only if the object is more than 5 units away
         */
        const visible =
            hasComponent(entity, VisibleComponent) &&
            !(
                FrustumCullCameraComponent.isCulled[entity] &&
                DistanceFromCameraComponent.squaredDistance[entity] > minimumFrustumCullDistanceSqr
            );

        for (const obj of group) obj.visible = visible;
    }
};

const ModelEntityReactor = () => {
    const entity = useEntityContext();
    const modelSceneID = useModelSceneID(entity);
    const childEntities = useHookstate(SourceComponent.entitiesBySourceState[modelSceneID]);

    return (
        <>
            {childEntities.value?.map(childEntity => (
                <ChildReactor key={childEntity} entity={childEntity} parentEntity={entity} />
            ))}
        </>
    );
};

const ChildReactor = props => {
    const isMesh = useOptionalComponent(props.entity, MeshComponent);
    const isModelColliders = useOptionalComponent(props.parentEntity, RigidBodyComponent);
    const isVisible = useOptionalComponent(props.entity, VisibleComponent);

    const shadowComponent = useOptionalComponent(props.parentEntity, ShadowComponent);
    useEffect(() => {
        if (!isMesh || !isVisible) return;
        if (shadowComponent)
            setComponent(
                props.entity,
                ShadowComponent,
                serializeComponent(props.parentEntity, ShadowComponent),
            );
        else removeComponent(props.entity, ShadowComponent);
    }, [isVisible, isMesh, shadowComponent?.cast, shadowComponent?.receive]);

    const envmapComponent = useOptionalComponent(props.parentEntity, EnvmapComponent);
    useEffect(() => {
        if (!isMesh || !isVisible) return;
        if (envmapComponent)
            setComponent(
                props.entity,
                EnvmapComponent,
                serializeComponent(props.parentEntity, EnvmapComponent),
            );
        else removeComponent(props.entity, EnvmapComponent);
    }, [
        isVisible,
        isMesh,
        envmapComponent,
        envmapComponent?.envMapIntensity,
        envmapComponent?.envmap,
        envmapComponent?.envMapSourceColor,
        envmapComponent?.envMapSourceURL,
        envmapComponent?.envMapTextureType,
        envmapComponent?.envMapSourceEntityUUID,
    ]);

    useEffect(() => {
        if (!isModelColliders || !isMesh) return;

        const geometry = getComponent(props.entity, MeshComponent).geometry;

        const shape = ThreeToPhysics[geometry.type];

        if (!shape) return;

        setComponent(props.entity, ColliderComponent, { shape });

        return () => {
            removeComponent(props.entity, ColliderComponent);
        };
    }, [isModelColliders, isMesh]);

    return null;
};

const reactor = () => {
    return (
        <>
            <QueryReactor Components={[ModelComponent]} ChildEntityReactor={ModelEntityReactor} />
            <GroupQueryReactor GroupChildReactor={SceneObjectReactor} />
        </>
    );
};
//<QueryReactor Components={[SourceComponent]} ChildEntityReactor={SceneObjectEntityReactor} />
export const SceneObjectSystem = defineSystem({
    uuid: "ee.engine.SceneObjectSystem",
    insert: { after: AnimationSystemGroup },
    execute,
    reactor,
});
