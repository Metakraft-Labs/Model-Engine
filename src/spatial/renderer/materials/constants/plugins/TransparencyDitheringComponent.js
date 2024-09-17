import { FrontSide, Uniform, Vector3 } from "three";

import { defineComponent, getComponent, useEntityContext } from "../../../ecs";

import { useEffect } from "react";
import { MaterialStateComponent } from "../../../spatial/renderer/materials/MaterialComponent";
import { setPlugin } from "../../../spatial/renderer/materials/materialFunctions";
import {
    ditheringAlphatestChunk,
    ditheringFragUniform,
    ditheringVertex,
    ditheringVertexUniform,
} from "./ditherShaderChunk";

export const ditherCalculationType = {
    worldTransformed: 1,
    localPosition: 0,
};

export const MAX_DITHER_POINTS = 2; //should be equal to the length of the vec3 array in the shader

export const TransparencyDitheringRoot = defineComponent({
    name: "TransparencyDitheringRoot",
    onInit: _entity => {
        return { materials: [] };
    },
    onSet: (entity, component, json) => {
        if (json?.materials) component.materials.set(json.materials);
    },
});

export const TransparencyDitheringPlugin = defineComponent({
    name: "TransparencyDithering",
    onInit: _entity => {
        return {
            centers: new Uniform(Array.from({ length: MAX_DITHER_POINTS }, () => new Vector3())),
            exponents: new Uniform(Array.from({ length: MAX_DITHER_POINTS }, () => 1)),
            distances: new Uniform(Array.from({ length: MAX_DITHER_POINTS }, () => 1)),
            useWorldCalculation: new Uniform(
                Array.from(
                    { length: MAX_DITHER_POINTS },
                    () => ditherCalculationType.worldTransformed,
                ),
            ),
        };
    },

    reactor: () => {
        const entity = useEntityContext();
        useEffect(() => {
            const materialComponent = getComponent(entity, MaterialStateComponent);
            const material = materialComponent.material;
            const callback = shader => {
                material.alphaTest = 0.5;
                material.side = FrontSide;
                const plugin = getComponent(entity, TransparencyDitheringPlugin);

                if (!shader.vertexShader.startsWith("varying vec3 vWorldPosition")) {
                    shader.vertexShader = shader.vertexShader.replace(
                        /#include <common>/,
                        "#include <common>\n" + ditheringVertexUniform,
                    );
                }
                shader.vertexShader = shader.vertexShader.replace(
                    /#include <worldpos_vertex>/,
                    "	#include <worldpos_vertex>\n" + ditheringVertex,
                );
                if (!shader.fragmentShader.startsWith("varying vec3 vWorldPosition"))
                    shader.fragmentShader = shader.fragmentShader.replace(
                        /#include <common>/,
                        "#include <common>\n" + ditheringFragUniform,
                    );
                shader.fragmentShader = shader.fragmentShader.replace(
                    /#include <alphatest_fragment>/,
                    ditheringAlphatestChunk,
                );
                shader.uniforms.centers = plugin.centers;
                shader.uniforms.exponents = plugin.exponents;
                shader.uniforms.distances = plugin.distances;
                shader.uniforms.useWorldCalculation = plugin.useWorldCalculation;
            };
            setPlugin(materialComponent.material, callback);
        });
        return null;
    },
});
