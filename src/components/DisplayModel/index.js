import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React, { useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export default function DisplayModel({ link, type = "shaded", obj }) {
    const model = useLoader(OBJLoader, obj);
    const modelGlb = useLoader(GLTFLoader, link);

    const geometry = useMemo(() => {
        let g;
        model.traverse(c => {
            if (c.type === "Mesh") {
                const _c = c;
                g = _c.geometry;
            }
        });
        return g;
    }, [model]);

    return (
        <Canvas
            camera={{ position: [-0.5, 1, 2] }}
            shadows
            style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
        >
            {/* eslint-disable react/no-unknown-property */}
            <directionalLight
                position={[3.3, 1.0, 4.4]}
                castShadow
                intensity={type === "shaded" ? 1 : Math.PI * 2}
            />
            <directionalLight
                position={[3.3, 1.0, -4.4]}
                castShadow
                intensity={type === "shaded" ? 1 : Math.PI * 2}
            />
            <directionalLight
                position={[-3.3, 1.0, 0]}
                castShadow
                intensity={type === "shaded" ? 1 : Math.PI * 2}
            />
            {/* eslint-disable react/no-unknown-property */}
            {type === "wireframe" ? (
                <mesh geometry={geometry} scale={1} position={[0, 1, 0]}>
                    <meshPhysicalMaterial wireframe={true} />
                </mesh>
            ) : (
                <primitive object={modelGlb.scene} position={[0, 1, 0]} children-0-castShadow />
            )}

            <OrbitControls target={[0, 1, 0]} />
        </Canvas>
    );
}
