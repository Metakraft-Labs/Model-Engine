import { DepthPass, ShaderPass } from "postprocessing";
import React, { useEffect } from "react";
import {
    Camera,
    Color,
    DepthTexture,
    NearestFilter,
    RGBAFormat,
    Scene,
    UnsignedIntType,
    Vector3,
    WebGLRenderTarget,
} from "three";

import {
    defineComponent,
    getComponent,
    setComponent,
    useComponent,
} from "../../../ecs/ComponentFunctions";
import { Engine } from "../../../ecs/Engine";
import { createEntity, useEntityContext } from "../../../ecs/EntityFunctions";
import { CameraComponent } from "../../../spatial/camera/components/CameraComponent";
import { setCallback } from "../../../spatial/common/CallbackComponent";
import { SDFShader } from "../../../spatial/renderer/effects/sdf/SDFShader";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";
import { TransformComponent } from "../../../spatial/transform/components/TransformComponent";

import { useRendererEntity } from "../../../spatial/renderer/functions/useRendererEntity";
import { UpdatableCallback, UpdatableComponent } from "./UpdatableComponent";

export const SDFComponent = defineComponent({
    name: "SDFComponent",
    jsonID: "EE_sdf",

    onInit: _entity => {
        return {
            color: new Color(0xffffff),
            scale: new Vector3(0.25, 0.001, 0.25),
            enable: false,
            mode: SDFMode.TORUS,
        };
    },
    onSet: (entity, component, json) => {
        if (!json) return;
        if (json.color?.isColor) {
            component.color.set(json.color);
        }
        if (typeof json.enable === "boolean") {
            component.enable.set(json.enable);
        }
        if (typeof json.mode === "number") {
            component.mode.set(json.mode);
        }
        if (typeof json.scale === "number") {
            component.scale.set(json.scale);
        }
    },
    toJSON: (entity, component) => {
        return {
            color: component.color.value,
            enable: component.enable.value,
            scale: component.scale.value,
            mode: component.mode.value,
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        const sdfComponent = useComponent(entity, SDFComponent);
        const rendererEntity = useRendererEntity(entity);

        useEffect(() => {
            const cameraTransform = getComponent(Engine.instance.cameraEntity, TransformComponent);
            const cameraPosition = cameraTransform.position;
            const transformComponent = getComponent(entity, TransformComponent);
            const cameraComponent = getComponent(Engine.instance.cameraEntity, CameraComponent);
            const updater = createEntity();
            setCallback(updater, UpdatableCallback, dt => {
                SDFShader.shader.uniforms.uTime.value += dt * 0.1;
            });

            SDFShader.shader.uniforms.cameraMatrix.value = cameraTransform.matrix;
            SDFShader.shader.uniforms.fov.value = cameraComponent.fov;
            SDFShader.shader.uniforms.aspectRatio.value = cameraComponent.aspect;
            SDFShader.shader.uniforms.near.value = cameraComponent.near;
            SDFShader.shader.uniforms.far.value = cameraComponent.far;
            SDFShader.shader.uniforms.sdfMatrix.value = transformComponent.matrixWorld;
            SDFShader.shader.uniforms.cameraPos.value = cameraPosition;
            setComponent(updater, UpdatableComponent, true);
        }, []);

        useEffect(() => {
            SDFShader.shader.uniforms.uColor.value = new Vector3(
                sdfComponent.color.value.r,
                sdfComponent.color.value.g,
                sdfComponent.color.value.b,
            );
        }, [sdfComponent.color]);

        useEffect(() => {
            SDFShader.shader.uniforms.scale.value = sdfComponent.scale.value;
        }, [sdfComponent.scale]);

        useEffect(() => {
            SDFShader.shader.uniforms.mode.value = sdfComponent.mode.value;
        }, [sdfComponent.mode]);

        if (!rendererEntity) return null;

        return <RendererReactor entity={entity} rendererEntity={rendererEntity} />;
    },
});

const RendererReactor = props => {
    const { entity, rendererEntity } = props;
    const sdfComponent = useComponent(entity, SDFComponent);
    const rendererComponent = useComponent(rendererEntity, RendererComponent);

    useEffect(() => {
        if (!rendererEntity) return;
        const composer = rendererComponent.effectComposer.value;
        if (!composer) return;

        const depthRenderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
        depthRenderTarget.texture.minFilter = NearestFilter;
        depthRenderTarget.texture.magFilter = NearestFilter;
        depthRenderTarget.texture.generateMipmaps = false;
        depthRenderTarget.stencilBuffer = false;
        depthRenderTarget.depthBuffer = true;
        depthRenderTarget.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight);
        depthRenderTarget.texture.format = RGBAFormat;
        depthRenderTarget.depthTexture.type = UnsignedIntType;

        const depthPass = new DepthPass(new Scene(), new Camera(), {
            renderTarget: depthRenderTarget,
        });

        composer.addPass(depthPass, 3); // hardcoded to 3, should add a registry instead later

        SDFShader.shader.uniforms.uDepth.value = depthRenderTarget.depthTexture;
        const SDFPass = new ShaderPass(SDFShader.shader, "inputBuffer");
        composer.addPass(SDFPass, 4);

        return () => {
            composer.removePass(depthPass);
            composer.removePass(SDFPass);
        };
    }, [sdfComponent.enable, rendererComponent.effectComposer]);

    return null;
};
