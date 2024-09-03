import { useEffect } from "react";
import { ShaderLib, ShaderMaterial, UniformsLib, UniformsUtils } from "three";

import {
    defineComponent,
    getComponent,
    getMutableComponent,
    hasComponent,
    removeComponent,
} from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { matches } from "../../../hyperflux";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { iterateEntityNode } from "../../../spatial/transform/components/EntityTree";

import { SkinnedMeshComponent } from "./SkinnedMeshComponent";

export const AvatarDissolveComponent = defineComponent({
    name: "AvatarDissolveComponent",

    onInit: entity => {
        return {
            height: 1,
            currentTime: 0,
            dissolveMaterials: [],
            originMaterials: [],
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;

        if (matches.number.test(json.height)) component.height.set(json.height);
        if (matches.number.test(json.currentTime)) component.currentTime.set(json.currentTime);
        if (json.dissolveMaterials) component.dissolveMaterials.set(json.dissolveMaterials);
        if (json.originMaterials) component.originMaterials.set(json.originMaterials);
    },

    reactor: () => {
        const entity = useEntityContext();

        useEffect(() => {
            const materialList = [];
            const dissolveMatList = [];

            iterateEntityNode(entity, entity => {
                if (!hasComponent(entity, SkinnedMeshComponent)) return;

                const mesh = getComponent(entity, SkinnedMeshComponent);
                if (mesh.material) {
                    const material = mesh.material;
                    materialList.push({
                        entity,
                        material: material,
                    });
                    mesh.material = AvatarDissolveComponent.createDissolveMaterial(mesh);
                    dissolveMatList.push(mesh.material);
                }
            });

            getMutableComponent(entity, AvatarDissolveComponent).merge({
                dissolveMaterials: dissolveMatList,
                originMaterials: materialList,
            });

            return () => {
                for (const originalMaterial of materialList) {
                    const avatarObject = getComponent(originalMaterial.entity, MeshComponent);
                    if (avatarObject) {
                        avatarObject.material = originalMaterial.material;
                    }
                }
            };
        }, []);

        return null;
    },

    createDissolveMaterial(object) {
        const isShaderMaterial = object.material.type == "ShaderMaterial";
        const material = object.material;
        const hasTexture = !!material.map;

        const shaderNameMapping = {
            MeshLambertMaterial: "lambert",
            MeshBasicMaterial: "basic",
            MeshStandardMaterial: "standard",
            MeshPhongMaterial: "phong",
            MeshMatcapMaterial: "matcap",
            MeshToonMaterial: "toon",
            PointsMaterial: "points",
            LineDashedMaterial: "dashed",
            MeshDepthMaterial: "depth",
            MeshNormalMaterial: "normal",
            MeshDistanceMaterial: "distanceRGBA",
            SpriteMaterial: "sprite",
        };

        let uniforms = {
            color: {
                value: material.color,
            },
            diffuse: {
                value: material.color,
            },
            time: {
                value: -200,
            },
        };

        let fragmentShader = "";
        let vertexShader = "";

        if (isShaderMaterial) {
            uniforms = UniformsUtils.merge([material.uniforms, uniforms]);
            fragmentShader = material.fragmentShader;
            vertexShader = material.vertexShader;
        } else {
            // built-in material
            const shader = ShaderLib[shaderNameMapping[material.type] ?? "standard"];
            fragmentShader = shader.fragmentShader;
            vertexShader = shader.vertexShader;
            Object.keys(shader.uniforms).forEach(key => {
                if (material[key]) {
                    uniforms[key] = { value: material[key] };
                }
            });
        }

        uniforms = UniformsUtils.merge([UniformsLib["lights"], uniforms]);

        const vertexUVShader = `
      #include <fog_vertex>
      vUv3 = uv;
      vPosition = position.y;
    `;

        let textureShader = `gl_FragColor = textureColor;`;
        if (hasTexture && material.map.isVideoTexture) {
            textureShader = `gl_FragColor = sRGBToLinear(textureColor);`;
        }

        const fragmentTextureShader = `
      #include <opaque_fragment>
      float offset = vPosition - time;
      vec4 textureColor = texture2D(map, vUv3);
      ${textureShader}
      if(offset > (-0.01 - rand(time) * 0.3)){
      gl_FragColor.r = 0.0;
      gl_FragColor.g = 1.0;
      gl_FragColor.b = 0.0;
      }
      if(offset > 0.0){
      discard;
      }
    `;

        const vertexHeaderShader = `
      #include <clipping_planes_pars_vertex>
      varying vec2 vUv3;
      varying float vPosition;
    `;

        const fragmentHeaderShader = `
      #include <clipping_planes_pars_fragment>
      varying vec2 vUv3;
      varying float vPosition;
      uniform float time;
      uniform sampler2D map;
      float rand(float co) { return fract(sin(co*(91.3458)) * 47453.5453); }
      vec4 sRGBToLinear( in vec4 value ) {
        return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
      }
    `;

        vertexShader = vertexShader.replace(
            "#include <clipping_planes_pars_vertex>",
            vertexHeaderShader,
        );
        vertexShader = vertexShader.replace("#include <fog_vertex>", vertexUVShader);
        fragmentShader = fragmentShader.replace(
            "#include <clipping_planes_pars_fragment>",
            fragmentHeaderShader,
        );
        fragmentShader = fragmentShader.replace(
            "#include <opaque_fragment>",
            fragmentTextureShader,
        );

        if (isShaderMaterial) {
            material.vertexShader = vertexShader;
            material.fragmentShader = fragmentShader;
            material.uniforms = uniforms;
            material.needsUpdate = true;
            return material;
        } else {
            const myMaterial = new ShaderMaterial({
                uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                lights: true,
                // @ts-ignore
                fog: false,
                transparent: material.transparent,
            });

            if (myMaterial.uniforms.map) {
                myMaterial.uniforms.map.value = material.map;
            }

            myMaterial.needsUpdate = true;
            myMaterial.visible = material.visible;
            return myMaterial;
        }
    },

    updateDissolveEffect(dissolveMaterials, entity, dt) {
        const dissolveComponent = getComponent(entity, AvatarDissolveComponent);
        if (!dissolveComponent) return false;
        dissolveComponent.currentTime += dt;
        for (let i = 0; i < dissolveMaterials.length; i++) {
            const material = dissolveMaterials[i];
            if (material === undefined) continue;
            material.uniforms.time.value = dissolveComponent.currentTime;
        }

        if (dissolveComponent.currentTime >= dissolveComponent.height)
            removeComponent(entity, AvatarDissolveComponent);
    },
});
