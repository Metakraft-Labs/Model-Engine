import { useEffect } from "react";
import { Color, LightProbe, WebGLCubeRenderTarget } from "three";

import { Engine } from "../../ecs";
import { getComponent, getMutableComponent, setComponent } from "../../ecs/ComponentFunctions";
import { UndefinedEntity } from "../../ecs/Entity";
import { createEntity } from "../../ecs/EntityFunctions";
import { defineSystem } from "../../ecs/SystemFunctions";
import { defineState, getMutableState, getState, useMutableState } from "../../hyperflux";

import { Vector3_Zero } from "../common/constants/MathConstants";
import { RendererComponent } from "../renderer/WebGLRendererSystem";
import { addObjectToGroup } from "../renderer/components/GroupComponent";
import { setVisibleComponent } from "../renderer/components/VisibleComponent";
import { DirectionalLightComponent } from "../renderer/components/lights/DirectionalLightComponent";
import { TransformComponent } from "../transform/components/TransformComponent";
import { XRState } from "./XRState";
import { XRSystem } from "./XRSystem";

export const XRLightProbeState = defineState({
    name: "ee.xr.LightProbe",
    initial: () => ({
        isEstimatingLight: false,
        lightProbe: new LightProbe(),
        probe: null,
        directionalLightEntity: UndefinedEntity,
        environment: null,
        xrWebGLBinding: null,
    }),
});

const updateReflection = () => {
    const xrLightProbeState = getState(XRLightProbeState);

    if (
        !xrLightProbeState.environment ||
        !xrLightProbeState.xrWebGLBinding ||
        !xrLightProbeState.probe
    )
        return;

    const textureProperties = getComponent(
        Engine.instance.viewerEntity,
        RendererComponent,
    ).renderer?.properties.get(xrLightProbeState.environment);

    if (textureProperties) {
        const cubeMap = xrLightProbeState.xrWebGLBinding?.getReflectionCubeMap?.(
            xrLightProbeState.probe,
        );
        if (cubeMap) {
            textureProperties.__webglTexture = cubeMap;
            xrLightProbeState.environment.needsPMREMUpdate = true;
        }
    }
};

/**
 * https://github.com/mrdoob/three.js/blob/master/examples/webxr_ar_lighting.html
 */
const execute = () => {
    const xrLightProbeState = getState(XRLightProbeState);

    const xrFrame = getState(XRState).xrFrame;
    if (!xrFrame) return;

    if (!xrLightProbeState.probe) return;

    if (!("getLightEstimate" in xrFrame)) return;

    const lightEstimate = xrFrame.getLightEstimate?.(xrLightProbeState.probe);
    if (lightEstimate) {
        if (!xrLightProbeState.isEstimatingLight)
            getMutableState(XRLightProbeState).isEstimatingLight.set(true);
        if (!xrLightProbeState.directionalLightEntity) return;

        // We can copy the estimate's spherical harmonics array directly into the light probe.
        xrLightProbeState.lightProbe.sh.fromArray(lightEstimate.sphericalHarmonicsCoefficients);
        xrLightProbeState.lightProbe.intensity = 1.0;

        // For the directional light we have to normalize the color and set the scalar as the
        // intensity, since WebXR can return color values that exceed 1.0.
        const intensityScalar = Math.max(
            1.0,
            Math.max(
                lightEstimate.primaryLightIntensity.x,
                Math.max(
                    lightEstimate.primaryLightIntensity.y,
                    lightEstimate.primaryLightIntensity.z,
                ),
            ),
        );

        const directionalLightState = getMutableComponent(
            xrLightProbeState.directionalLightEntity,
            DirectionalLightComponent,
        );

        directionalLightState.color.set(
            new Color(
                lightEstimate.primaryLightIntensity.x / intensityScalar,
                lightEstimate.primaryLightIntensity.y / intensityScalar,
                lightEstimate.primaryLightIntensity.z / intensityScalar,
            ),
        );
        directionalLightState.intensity.set(intensityScalar);

        getComponent(
            xrLightProbeState.directionalLightEntity,
            TransformComponent,
        ).rotation.setFromUnitVectors(Vector3_Zero, lightEstimate.primaryLightDirection);
    }
};

const reactor = () => {
    const xrState = useMutableState(XRState);
    const xrLightProbeState = useMutableState(XRLightProbeState);

    useEffect(() => {
        const xrLightProbeState = getState(XRLightProbeState);
        xrLightProbeState.lightProbe.intensity = 0;
    }, []);

    useEffect(() => {
        const session = xrState.session.value;
        if (!session) return;

        const lightingSupported = "requestLightProbe" in session;
        if (!lightingSupported) return console.warn("No light probe available");

        session
            .requestLightProbe({
                reflectionFormat: session.preferredReflectionFormat,
            })
            .then(probe => {
                xrLightProbeState.probe.set(probe);
            })
            .catch(err => {
                console.warn("Tried to initialize light probe but failed with error", err);
            });

        return () => {
            xrLightProbeState.environment.set(null);
            xrLightProbeState.xrWebGLBinding.set(null);
            xrLightProbeState.isEstimatingLight.set(false);
            xrLightProbeState.probe.set(null);
        };
    }, [xrState.session]);

    useEffect(() => {
        if (!xrLightProbeState.isEstimatingLight.value) return;

        if (xrState.sessionMode.value !== "immersive-ar") return;

        const directionalLightEntity = createEntity();
        setComponent(directionalLightEntity, DirectionalLightComponent, {
            intensity: 0,
            shadowBias: -0.000001,
            shadowRadius: 1,
            cameraFar: 2000,
            castShadow: true,
        });
        addObjectToGroup(directionalLightEntity, getState(XRLightProbeState).lightProbe);
        setVisibleComponent(directionalLightEntity, true);

        xrLightProbeState.directionalLightEntity.set(directionalLightEntity);

        return () => {
            xrLightProbeState.directionalLightEntity.set(UndefinedEntity);
        };
    }, [xrLightProbeState.isEstimatingLight]);

    useEffect(() => {
        const session = getState(XRState).session;
        const probe = xrLightProbeState.probe.value;
        if (!probe || !session) return;

        // If the XRWebGLBinding class is available then we can also query an
        // estimated reflection cube map.
        if ("XRWebGLBinding" in window) {
            // This is the simplest way I know of to initialize a WebGL cubemap in Three.
            const cubeRenderTarget = new WebGLCubeRenderTarget(16);
            xrLightProbeState.environment.set(cubeRenderTarget.texture);

            const gl = getComponent(
                Engine.instance.viewerEntity,
                RendererComponent,
            ).renderer?.getContext();

            // Ensure that we have any extensions needed to use the preferred cube map format.
            switch (session.preferredReflectionFormat) {
                case "srgba8":
                    gl.getExtension("EXT_sRGB");
                    break;

                case "rgba16f":
                    gl.getExtension("OES_texture_half_float");
                    break;
            }

            xrLightProbeState.xrWebGLBinding.set(new XRWebGLBinding(session, gl));

            probe.addEventListener("reflectionchange", () => {
                updateReflection();
            });
        }
    }, [xrLightProbeState.probe]);

    return null;
};

export const XRLightProbeSystem = defineSystem({
    uuid: "ee.engine.XRLightProbeSystem",
    insert: { with: XRSystem },
    execute,
    reactor,
});
