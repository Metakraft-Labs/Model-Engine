import { InstancedMesh, Object3D } from "three";

import {
    getComponent,
    getMutableComponent,
    getOptionalMutableComponent,
    hasComponent,
} from "../../../../ecs/ComponentFunctions";
import { getState } from "../../../../hyperflux";
import { isMobile } from "../../../../spatial/common/functions/isMobile";
import { addOBCPlugin } from "../../../../spatial/common/functions/OnBeforeCompilePlugin";
import { EngineState } from "../../../../spatial/EngineState";
import {
    addObjectToGroup,
    GroupComponent,
    removeObjectFromGroup,
} from "../../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../../spatial/renderer/components/MeshComponent";
import { DistanceFromCameraComponent } from "../../../../spatial/transform/components/DistanceComponents";
import { isMobileXRHeadset } from "../../../../spatial/xr/XRState";

import { STATIC_ASSET_REGEX } from "../../../../common/src/regex";
import { getGLTFAsync } from "../../../assets/functions/resourceLoaderHooks";
import { InstancingComponent } from "../../components/InstancingComponent";
import { ModelComponent } from "../../components/ModelComponent";
import { distanceBased, Heuristic, VariantComponent } from "../../components/VariantComponent";
import getFirstMesh from "../../util/meshUtils";

export function updateModelVariant(entity, variantComponent, modelComponent) {
    if (variantComponent.heuristic.value === Heuristic.DEVICE) {
        const targetDevice = isMobile || isMobileXRHeadset ? "MOBILE" : "DESKTOP";
        //get model src to mobile variant src
        const levelIndex = variantComponent.levels.findIndex(
            level => level.metadata["device"] === targetDevice,
        );
        if (levelIndex < 0) return;
        const deviceVariant = variantComponent.levels[levelIndex];
        const modelRelativePath = STATIC_ASSET_REGEX.exec(modelComponent.src.value)?.[3];
        const deviceRelativePath = deviceVariant
            ? STATIC_ASSET_REGEX.exec(deviceVariant.src.value)?.[3]
            : "";
        if (deviceVariant && modelRelativePath !== deviceRelativePath) {
            variantComponent.currentLevel.set(levelIndex);
        }
    } else if (distanceBased(variantComponent.value)) {
        const distance = DistanceFromCameraComponent.squaredDistance[entity];
        for (let i = 0; i < variantComponent.levels.length; i++) {
            const level = variantComponent.levels[i].value;
            if ([level.metadata["minDistance"], level.metadata["maxDistance"]].includes(undefined))
                continue;
            const minDistance = Math.pow(level.metadata["minDistance"], 2);
            const maxDistance = Math.pow(level.metadata["maxDistance"], 2);
            const useLevel = minDistance <= distance && distance <= maxDistance;
            if (useLevel && level.src) {
                if (variantComponent.heuristic.value === Heuristic.BUDGET) {
                    if (i >= variantComponent.budgetLevel.value)
                        variantComponent.currentLevel.set(i);
                    else variantComponent.currentLevel.set(variantComponent.budgetLevel.value);
                } else variantComponent.currentLevel.set(i);
                break;
            }
        }
    } else if (
        variantComponent.heuristic.value === Heuristic.BUDGET &&
        variantComponent.budgetLevel.value != variantComponent.currentLevel.value
    ) {
        variantComponent.currentLevel.set(variantComponent.budgetLevel.value);
    }
}

function getMeshVariant(_entity, variantComponent) {
    if (variantComponent.heuristic === Heuristic.DEVICE) {
        const targetDevice = isMobileXRHeadset ? "XR" : isMobile ? "MOBILE" : "DESKTOP";
        //get model src to mobile variant src
        const deviceVariant = variantComponent.levels.find(
            level => level.metadata["device"] === targetDevice,
        );
        if (deviceVariant) return deviceVariant.src;
    }

    return null;
}

export function updateVariant(entity) {
    if (!entity || getState(EngineState).isEditing) return null;
    const variantComponent = getOptionalMutableComponent(entity, VariantComponent);
    if (!variantComponent) return null;

    const modelComponent = getOptionalMutableComponent(entity, ModelComponent);
    if (modelComponent) updateModelVariant(entity, variantComponent, modelComponent);
}

/**
 * Handles setting LOD level for variant components of models based on performance offset
 * @param entity
 * @param performanceOffset
 */
export function setModelVariantLOD(entity, performanceOffset) {
    const variantComponent = getMutableComponent(entity, VariantComponent);
    if (variantComponent.heuristic.value === Heuristic.BUDGET)
        variantComponent.budgetLevel.set(
            Math.min(performanceOffset, variantComponent.levels.length - 1),
        );
}

/**
 * Handles setting model src for model component based on variant component
 * @param entity
 */
export function setModelVariant(entity) {
    const variantComponent = getMutableComponent(entity, VariantComponent);
    const modelComponent = getMutableComponent(entity, ModelComponent);

    updateModelVariant(entity, variantComponent, modelComponent);
}

export async function setMeshVariant(entity) {
    const variantComponent = getComponent(entity, VariantComponent);
    const meshComponent = getComponent(entity, MeshComponent);

    const src = getMeshVariant(entity, variantComponent);
    if (!src) return;
    const [gltf] = await getGLTFAsync(src, entity);
    if (!gltf) return;
    const mesh = getFirstMesh(gltf.scene);
    if (!mesh) return;
    if (!hasComponent(entity, MeshComponent)) return;
    meshComponent.geometry = mesh.geometry;
    meshComponent.material = mesh.material;
    getMutableComponent(entity, MeshComponent).set(val => val); // reactivly update mesh
}

export async function setInstancedMeshVariant(entity) {
    const variantComponent = getComponent(entity, VariantComponent);
    const meshComponent = getComponent(entity, MeshComponent);
    const instancingComponent = getComponent(entity, InstancingComponent);
    // const transformComponent = getComponent(entity, TransformComponent);
    if (variantComponent.heuristic === Heuristic.DEVICE) {
        const targetDevice = isMobileXRHeadset ? "XR" : isMobile ? "MOBILE" : "DESKTOP";
        //set model src to mobile variant src
        const deviceVariant = variantComponent.levels.find(
            level => level.metadata["device"] === targetDevice,
        );
        if (!deviceVariant) return;
        const [gltf] = await getGLTFAsync(deviceVariant.src, entity);
        if (!gltf) return;
        const mesh = getFirstMesh(gltf.scene);
        if (!mesh) return;
        if (!hasComponent(entity, MeshComponent)) return;
        meshComponent.geometry = mesh.geometry;
        meshComponent.material = mesh.material;
        getMutableComponent(entity, MeshComponent).set(val => val); // reactivly update mesh
    } else if (variantComponent.heuristic === Heuristic.DISTANCE) {
        const referencedVariants = [];
        const variantIndices = [];
        // const cameraPosition = getComponent(
        //     Engine.instance.cameraEntity,
        //     TransformComponent,
        // ).position;
        // const position = new Vector3();
        //complex solution: load only variants in range
        /*for (let i = 0; i < instancingComponent.instanceMatrix.count; i++) {
      //for each level, check if distance is in range
      position.set(
        instancingComponent.instanceMatrix.array[i * 16 + 12],
        instancingComponent.instanceMatrix.array[i * 16 + 13],
        instancingComponent.instanceMatrix.array[i * 16 + 14]
      )
      position.applyMatrix4(transformComponent.matrix)
      const distanceSq = cameraPosition.distanceToSquared(position)
      for (let j = 0; j < variantComponent.levels.length; j++) {
        const level = variantComponent.levels[j]
        const minDistance = Math.pow(level.metadata['minDistance'], 2)
        const maxDistance = Math.pow(level.metadata['maxDistance'], 2)
        const useLevel = minDistance <= distanceSq && distanceSq <= maxDistance
        if (useLevel) {
          if (!referencedVariants.includes(level)) {
            referencedVariants.push(level)
            variantIndices.push(j)
          }
        }
      }
    }*/

        //naive solution: load all variants
        for (let i = 0; i < variantComponent.levels.length; i++) {
            referencedVariants.push(variantComponent.levels[i]);
            variantIndices.push(i);
        }
        const group = getComponent(entity, GroupComponent);
        const loadedVariants = [];
        //for levels in range, check if already loaded
        for (let i = 0; i < group.length; i++) {
            const loadedElement = group[i];
            if (!loadedElement.userData["variant"]) continue;
            const elementVariantData = loadedElement.userData["variant"];
            const loadedVariant = referencedVariants.find(
                (variant, index) =>
                    //if already loaded, check that the src and index are the same
                    variant.src === elementVariantData.src &&
                    variantIndices[index] === elementVariantData.index,
            );
            if (loadedVariant) {
                loadedVariants.push(loadedVariant);
                continue;
            }
            //if not referenced or src is different, remove from group
            removeObjectFromGroup(entity, loadedElement);
        }
        for (let i = 0; i < referencedVariants.length; i++) {
            const referencedVariant = referencedVariants[i];
            if (loadedVariants.includes(referencedVariant)) continue; //already loaded
            //if not already loaded, load src
            //add a placeholder element with src and index to group until actual variant loads
            const placeholder = new Object3D();
            placeholder.userData["variant"] = {
                src: referencedVariant.src,
                index: variantIndices[i],
            };
            addObjectToGroup(entity, placeholder);
            const [gltf] = await getGLTFAsync(referencedVariant.src, entity);
            if (!gltf) return;
            const minDistance = referencedVariant.metadata["minDistance"];
            const maxDistance = referencedVariant.metadata["maxDistance"];
            const mesh = getFirstMesh(gltf.scene);
            if (!mesh) return;
            //convert to instanced mesh, using existing instance matrix
            const instancedMesh =
                mesh instanceof InstancedMesh
                    ? mesh
                    : new InstancedMesh(
                          mesh.geometry,
                          mesh.material,
                          instancingComponent.instanceMatrix.count,
                      );
            instancedMesh.instanceMatrix = instancingComponent.instanceMatrix;
            instancedMesh.frustumCulled = false;

            //add distance culling shader plugin
            const materials = Array.isArray(instancedMesh.material)
                ? instancedMesh.material
                : [instancedMesh.material];
            for (const material of materials) {
                addOBCPlugin(material, {
                    id: "lod-culling",
                    priority: 1,
                    compile: (shader, _renderer) => {
                        shader.fragmentShader = shader.fragmentShader.replace(
                            "void main() {\n",
                            `
      void main() {
        float maxDistance = ${maxDistance.toFixed(1)};
        float minDistance = ${minDistance.toFixed(1)};
        // Calculate the camera distance from the geometry
        float cameraDistance = length(vViewPosition);
        // Discard fragments outside the minDistance and maxDistance range
        if (cameraDistance <= minDistance || cameraDistance >= maxDistance) {
          discard;
        }
    `,
                        );
                    },
                });
            }
            //add variant metadata to mesh
            instancedMesh.userData["variant"] = {
                src: referencedVariant.src,
                index: variantIndices[i],
            };
            //remove placeholder
            removeObjectFromGroup(entity, placeholder);
            //add to group
            addObjectToGroup(entity, instancedMesh);
        }
    }
}
