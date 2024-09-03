import React, { useEffect } from "react";

import { PresentationSystemGroup, QueryReactor, useComponent, useEntityContext } from "../../ecs";
import { ECSState } from "../../ecs/ECSState";
import { defineSystem } from "../../ecs/SystemFunctions";
import { getState } from "../../hyperflux";
import {
    addOBCPlugin,
    removeOBCPlugin,
} from "../../spatial/common/functions/OnBeforeCompilePlugin";
import { GroupComponent } from "../../spatial/renderer/components/GroupComponent";
import { VisibleComponent } from "../../spatial/renderer/components/VisibleComponent";

import { FogSettingsComponent, FogType } from "./components/FogSettingsComponent";

export const FogShaders = [];

const getFogPlugin = () => {
    return {
        id: "ee.engine.FogPlugin",
        priority: 0,
        compile: shader => {
            FogShaders.push(shader);
            shader.uniforms.fogTime = { value: 0.0 };
            shader.uniforms.fogTimeScale = { value: 1 };
            shader.uniforms.heightFactor = { value: 0.05 };
        },
    };
};

function addFogShaderPlugin(obj) {
    if (!obj.material || !obj.material.fog || obj.material.userData.fogPlugin) return;
    obj.material.userData.fogPlugin = getFogPlugin();
    addOBCPlugin(obj.material, obj.material.userData.fogPlugin);
    obj.material.needsUpdate = true;
}

function removeFogShaderPlugin(obj) {
    if (!obj.material?.userData?.fogPlugin) return;
    removeOBCPlugin(obj.material, obj.material.userData.fogPlugin);
    delete obj.material.userData.fogPlugin;
    obj.material.needsUpdate = true;
    const shader = obj.material.shader; // todo add typings somehow
    FogShaders.splice(FogShaders.indexOf(shader), 1);
}

function FogGroupReactor(props) {
    const entity = useEntityContext();
    const fogComponent = useComponent(props.fogEntity, FogSettingsComponent);
    const group = useComponent(entity, GroupComponent);

    useEffect(() => {
        const customShader =
            fogComponent.type.value === FogType.Brownian ||
            fogComponent.type.value === FogType.Height;
        if (customShader) {
            const objs = [...group.value];
            for (const obj of objs) addFogShaderPlugin(obj);
            return () => {
                for (const obj of objs) removeFogShaderPlugin(obj);
            };
        }
    }, [fogComponent.type, group]);

    return null;
}

const FogReactor = () => {
    const entity = useEntityContext();
    return (
        <QueryReactor
            ChildEntityReactor={FogGroupReactor}
            Components={[GroupComponent, VisibleComponent]}
            props={{ fogEntity: entity }}
        />
    );
};

const reactor = () => {
    // TODO support multiple fog entities via spatial queries
    return <QueryReactor ChildEntityReactor={FogReactor} Components={[FogSettingsComponent]} />;
};

const execute = () => {
    for (const s of FogShaders) {
        if (s.uniforms.fogTime) s.uniforms.fogTime.value = getState(ECSState).elapsedSeconds;
    }
};

export const FogSystem = defineSystem({
    uuid: "ee.engine.FogSystem",
    insert: { after: PresentationSystemGroup },
    execute,
    reactor,
});
