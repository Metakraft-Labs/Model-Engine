import { useEffect } from "react";
import { LinearToneMapping, PCFSoftShadowMap } from "three";

import { defineComponent, getComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { useRendererEntity } from "../../../spatial/renderer/functions/useRendererEntity";

export const RenderSettingsComponent = defineComponent({
    name: "RenderSettingsComponent",
    jsonID: "EE_render_settings",

    onInit(_entity) {
        return {
            primaryLight: "",
            csm: true,
            cascades: 5,
            toneMapping: LinearToneMapping,
            toneMappingExposure: 0.8,
            shadowMapType: PCFSoftShadowMap,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (typeof json.primaryLight === "string") component.primaryLight.set(json.primaryLight);
        if (typeof json.csm === "boolean") component.csm.set(json.csm);
        if (typeof json.cascades === "number") component.cascades.set(json.cascades);
        if (typeof json.toneMapping === "number") component.toneMapping.set(json.toneMapping);
        if (typeof json.toneMappingExposure === "number")
            component.toneMappingExposure.set(json.toneMappingExposure);
        if (typeof json.shadowMapType === "number") component.shadowMapType.set(json.shadowMapType);
    },

    toJSON: (entity, component) => {
        return {
            primaryLight: component.primaryLight.value,
            csm: component.csm.value,
            cascades: component.cascades.value,
            toneMapping: component.toneMapping.value,
            toneMappingExposure: component.toneMappingExposure.value,
            shadowMapType: component.shadowMapType.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const rendererEntity = useRendererEntity(entity);
        const component = useComponent(entity, RenderSettingsComponent);

        useEffect(() => {
            if (!rendererEntity) return;
            const renderer = getComponent(rendererEntity, RendererComponent).renderer;
            renderer.toneMapping = component.toneMapping.value;
        }, [component.toneMapping]);

        useEffect(() => {
            if (!rendererEntity) return;
            const renderer = getComponent(rendererEntity, RendererComponent).renderer;
            renderer.toneMappingExposure = component.toneMappingExposure.value;
        }, [component.toneMappingExposure]);

        useEffect(() => {
            if (!rendererEntity) return;
            const renderer = getComponent(rendererEntity, RendererComponent).renderer;
            renderer.shadowMap.type = component.shadowMapType.value;
            renderer.shadowMap.needsUpdate = true;
        }, [component.shadowMapType]);

        return null;
    },
});
