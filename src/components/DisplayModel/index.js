import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React, { useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TextureLoader } from "three/src/loaders/TextureLoader";

export default function DisplayModel({ link, type = "shaded", obj = {}, material = "default" }) {
    let model;
    let modelGlb;

    let geometry;

    if (type !== "texture") {
        model = useLoader(OBJLoader, obj);
        modelGlb = useLoader(GLTFLoader, link);

        geometry = useMemo(() => {
            let g;
            model.traverse(c => {
                if (c.type === "Mesh") {
                    const _c = c;
                    g = _c.geometry;
                }
            });
            return g;
        }, [model]);
    }

    let textureModel;

    if (type === "texture") {
        textureModel = useLoader(TextureLoader, link);
    }

    return (
        <Canvas
            camera={{ position: [-0.5, 1, 2] }}
            shadows
            style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
        >
            {/* eslint-disable react/no-unknown-property */}
            {type === "texture" ? (
                <>
                    <ambientLight intensity={0.5} />
                    <directionalLight />
                </>
            ) : (
                <>
                    <directionalLight
                        position={[3.3, 1.0, 4.4]}
                        castShadow
                        intensity={Math.PI * 2}
                    />
                    <directionalLight
                        position={[3.3, 1.0, -4.4]}
                        castShadow
                        intensity={Math.PI * 2}
                    />
                    <directionalLight
                        position={[-3.3, 1.0, 0]}
                        castShadow
                        intensity={Math.PI * 2}
                    />
                </>
            )}
            {/* eslint-disable react/no-unknown-property */}
            {type === "wireframe" ? (
                <mesh geometry={geometry} scale={1} position={[0, 1, 0]}>
                    <meshPhysicalMaterial
                        wireframe={true}
                        color={"#FFFFFF"}
                        emissive={"#454545"}
                        {...(material === "metallic" ? { metalness: 100 } : {})}
                    />
                </mesh>
            ) : type === "shaded" ? (
                <mesh geometry={geometry} scale={1} position={[0, 1, 0]}>
                    <meshPhysicalMaterial
                        color={"#404040"}
                        emissive={"#454545"}
                        {...(material === "metallic" ? { metalness: 100 } : {})}
                    />
                </mesh>
            ) : type === "texture" ? (
                <mesh scale={1} position={[0, 1, 0]}>
                    <sphereGeometry args={[0.5, 32, 32]} />
                    <meshStandardMaterial map={textureModel} roughness={100} />
                </mesh>
            ) : (
                <primitive
                    object={modelGlb.scene}
                    position={[0, 1, 0]}
                    children-0-castShadow
                    {...(material === "metallic" ? { metalness: 100 } : {})}
                />
            )}

            <OrbitControls target={[0, 1, 0]} />
        </Canvas>
    );
}
