import {
    UUIDComponent,
    defineComponent,
    defineQuery,
    getComponent,
    getMutableComponent,
} from "../../../ecs";
import { UndefinedEntity } from "../../../ecs/Entity";

import { v4 as uuidv4 } from "uuid";
import { NoiseOffsetPlugin } from "./constants/plugins/NoiseOffsetPlugin";
import { TransparencyDitheringPlugin } from "./constants/plugins/TransparencyDitheringComponent";
import { setMeshMaterial } from "./materialFunctions";
import MeshBasicMaterial from "./prototypes/MeshBasicMaterial.mat";
import MeshLambertMaterial from "./prototypes/MeshLambertMaterial.mat";
import MeshMatcapMaterial from "./prototypes/MeshMatcapMaterial.mat";
import MeshPhongMaterial from "./prototypes/MeshPhongMaterial.mat";
import MeshPhysicalMaterial from "./prototypes/MeshPhysicalMaterial.mat";
import MeshStandardMaterial from "./prototypes/MeshStandardMaterial.mat";
import MeshToonMaterial from "./prototypes/MeshToonMaterial.mat";
import { ShaderMaterial } from "./prototypes/ShaderMaterial.mat";
import { ShadowMaterial } from "./prototypes/ShadowMaterial.mat";

export const MaterialPrototypeDefinitions = [
    MeshBasicMaterial,
    MeshStandardMaterial,
    MeshMatcapMaterial,
    MeshPhysicalMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial,
    MeshToonMaterial,
    ShaderMaterial,
    ShadowMaterial,
];

export const MaterialPlugins = { TransparencyDitheringPlugin, NoiseOffsetPlugin };

export const MaterialStateComponent = defineComponent({
    name: "MaterialStateComponent",
    onInit: _entity => {
        return {
            // material & material specific data
            material: {},
            parameters: {},
            // all entities using this material. an undefined entity at index 0 is a fake user
            instances: [],
            prototypeEntity: UndefinedEntity,
        };
    },

    onSet: (entity, component, json) => {
        if (json?.material && component.material.value !== undefined)
            component.material.set(json.material);
        if (json?.parameters && component.parameters.value !== undefined)
            component.parameters.set(json.parameters);
        if (json?.instances && component.instances.value !== undefined)
            component.instances.set(json.instances);
        if (json?.prototypeEntity && component.prototypeEntity.value !== undefined)
            component.prototypeEntity.set(json.prototypeEntity);
    },

    fallbackMaterial: uuidv4(),

    onRemove: entity => {
        const materialComponent = getComponent(entity, MaterialStateComponent);
        for (const instanceEntity of materialComponent.instances) {
            setMeshMaterial(
                instanceEntity,
                getComponent(instanceEntity, MaterialInstanceComponent).uuid,
            );
        }
    },
});

export const MaterialInstanceComponent = defineComponent({
    name: "MaterialInstanceComponent",
    onInit: _entity => {
        return {
            uuid: [],
        };
    },
    onSet: (entity, component, json) => {
        if (json?.uuid && component.uuid.value !== undefined) component.uuid.set(json.uuid);
    },
    onRemove: entity => {
        const uuids = getComponent(entity, MaterialInstanceComponent).uuid;
        for (const uuid of uuids) {
            const materialEntity = UUIDComponent.getEntityByUUID(uuid);
            const materialComponent = getMutableComponent(materialEntity, MaterialStateComponent);
            if (materialComponent.instances.value)
                materialComponent.instances.set(
                    materialComponent.instances.value.filter(instance => instance !== entity),
                );
        }
    },
});

export const MaterialPrototypeComponent = defineComponent({
    name: "MaterialPrototypeComponent",
    onInit: _entity => {
        return {
            prototypeArguments: {},
            prototypeConstructor: {},
        };
    },
    onSet: (entity, component, json) => {
        if (json?.prototypeArguments && component.prototypeArguments.value !== undefined)
            component.prototypeArguments.set(json.prototypeArguments);
        if (json?.prototypeConstructor && component.prototypeConstructor.value !== undefined)
            component.prototypeConstructor.set(json.prototypeConstructor);
    },
});

export const prototypeQuery = defineQuery([MaterialPrototypeComponent]);
