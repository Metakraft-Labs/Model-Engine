import { useLayoutEffect } from "react";

import {
    defineComponent,
    hasComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { createEntity, removeEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { getMutableState, matches, NO_PROXY, none, useHookstate } from "../../../hyperflux";
import { NameComponent } from "../../../spatial/common/NameComponent";
import {
    addObjectToGroup,
    removeObjectFromGroup,
} from "../../../spatial/renderer/components/GroupComponent";
import { setObjectLayers } from "../../../spatial/renderer/components/ObjectLayerComponent";
import { setVisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { ObjectLayers } from "../../../spatial/renderer/constants/ObjectLayers";
import { RendererState } from "../../../spatial/renderer/RendererState";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";

import { useGLTF } from "../../assets/functions/resourceLoaderHooks";

const GLTF_PATH = "/static/editor/spawn-point.glb";

export const SpawnPointComponent = defineComponent({
    name: "SpawnPointComponent",
    jsonID: "EE_spawn_point",

    onInit: _entity => {
        return {
            permissionedUsers: [],
            helperEntity: null,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (matches.array.test(json.permissionedUsers))
            component.permissionedUsers.set(json.permissionedUsers);
    },

    toJSON: (_entity, component) => {
        return {
            permissionedUsers: component.permissionedUsers.get(NO_PROXY),
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const debugEnabled = useHookstate(getMutableState(RendererState).nodeHelperVisibility);
        const spawnPoint = useComponent(entity, SpawnPointComponent);

        const [gltf] = useGLTF(debugEnabled.value ? GLTF_PATH : "", entity);

        useLayoutEffect(() => {
            const scene = gltf?.scene;
            if (!scene || !debugEnabled.value) return;

            const helperEntity = createEntity();
            setComponent(helperEntity, EntityTreeComponent, { parentEntity: entity });
            spawnPoint.helperEntity.set(helperEntity);

            scene.name = `spawn-point-helper-${entity}`;
            addObjectToGroup(helperEntity, scene);
            setObjectLayers(scene, ObjectLayers.NodeHelper);
            setComponent(helperEntity, NameComponent, scene.name);

            setVisibleComponent(spawnPoint.helperEntity.value, true);

            return () => {
                removeObjectFromGroup(helperEntity, scene);
                removeEntity(helperEntity);
                if (!hasComponent(entity, SpawnPointComponent)) return;
                spawnPoint.helperEntity.set(none);
            };
        }, [gltf, debugEnabled]);

        return null;
    },
});
