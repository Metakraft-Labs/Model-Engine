import { Uniform, Vector3 } from "three";

import {
    defineComponent,
    defineQuery,
    getComponent,
    PresentationSystemGroup,
    useEntityContext,
} from "../../../../../ecs";
import { ECSState } from "../../../../../ecs/ECSState";
import { defineSystem } from "../../../../../ecs/SystemFunctions";
import { getState } from "../../../../../hyperflux";
import { generateNoiseTexture } from "../../../../../spatial/renderer/functions/generateNoiseTexture";

import { useEffect } from "react";
import { MaterialStateComponent } from "../../MaterialComponent";
import { setPlugin } from "../../materialFunctions";

export const NoiseOffsetPlugin = defineComponent({
    name: "NoiseOffsetPlugin",
    onInit: _entity => {
        return {
            textureSize: new Uniform(64),
            frequency: new Uniform(0.00025),
            amplitude: new Uniform(0.005),
            noiseTexture: new Uniform(generateNoiseTexture(64)),
            offsetAxis: new Uniform(new Vector3(0, 1, 0)),
            time: new Uniform(0),
        };
    },
    reactor: () => {
        const entity = useEntityContext();
        useEffect(() => {
            const materialComponent = getComponent(entity, MaterialStateComponent);
            const callback = shader => {
                const plugin = getComponent(entity, NoiseOffsetPlugin);

                shader.uniforms.textureSize = plugin.textureSize;
                shader.uniforms.frequency = plugin.frequency;
                shader.uniforms.amplitude = plugin.amplitude;
                plugin.noiseTexture.value = generateNoiseTexture(64);
                shader.uniforms.noiseTexture = plugin.noiseTexture;
                shader.uniforms.offsetAxis = plugin.offsetAxis;
                shader.uniforms.time = plugin.time;

                shader.vertexShader = shader.vertexShader.replace(
                    "void main() {",
                    `
            uniform sampler2D noiseTexture;
            uniform float textureSize; // The width of a slice
            uniform float frequency;
            uniform float amplitude;
            uniform float time;
    
            vec3 sampleNoise(vec3 pos) {
                float zSlice = (pos.z * textureSize);
                vec2 slicePos = vec2(zSlice / textureSize, fract(zSlice / textureSize));
                vec2 noisePos = slicePos + pos.xy / textureSize;
                return vec3(texture2D(noiseTexture, noisePos).r);
            }
    
            vec3 turbulence(vec3 position) {
              vec3 sum = vec3(0.0);
              float frequencyMutliplied = frequency;
              float amplitudeMultiplied = amplitude;
    
              for (int i = 0; i < 4; i++) {
                  vec3 p = position * frequencyMutliplied;
                  p.z += time * 0.0015;
    
                  sum += sampleNoise(p).rgb * amplitudeMultiplied;
              
                  frequencyMutliplied *= 2.0;
                  amplitudeMultiplied *= 7.0;
              }
            
              return sum;
            }
    
            void main() {
          `,
                );
                shader.vertexShader = shader.vertexShader.replace(
                    "void main() {",
                    `uniform vec3 offsetAxis;
        void main() {`,
                );
                shader.vertexShader = shader.vertexShader.replace(
                    "#include <begin_vertex>",
                    `
            #include <begin_vertex>
            vec4 noiseWorldPosition = vec4(transformed, 1.0);
            noiseWorldPosition = modelMatrix * noiseWorldPosition;
            #ifdef USE_INSTANCING
              noiseWorldPosition = instanceMatrix * noiseWorldPosition;
            #endif
            vec3 offset = turbulence(noiseWorldPosition.xyz) * offsetAxis;
            transformed += offset;
          `,
                );
            };
            setPlugin(materialComponent.material, callback);
        });
        return null;
    },
});

const noisePluginQuery = defineQuery([NoiseOffsetPlugin]);
const execute = () => {
    for (const entity of noisePluginQuery()) {
        const noisePlugin = getComponent(entity, NoiseOffsetPlugin);
        const elapsedSeconds = getState(ECSState).elapsedSeconds;
        noisePlugin.time.value = elapsedSeconds;
    }
};

export const NoiseOffsetSystem = defineSystem({
    uuid: "ee.spatial.material.NoiseOffsetSystem",
    insert: { before: PresentationSystemGroup },
    execute,
});
