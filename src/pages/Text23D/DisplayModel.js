import { Circle, OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function DisplayModel({ link }) {
    const model = useLoader(GLTFLoader, link);

    return (
        <Canvas
            camera={{ position: [-0.5, 1, 2] }}
            shadows
            style={{ height: "100%", width: "980px" }}
        >
            {/* eslint-disable react/no-unknown-property */}
            <directionalLight position={[3.3, 1.0, 4.4]} castShadow intensity={Math.PI * 2} />
            {/* eslint-disable react/no-unknown-property */}
            <primitive object={model.scene} position={[0, 1, 0]} children-0-castShadow />
            <Circle args={[10]} rotation-x={-Math.PI / 2} receiveShadow>
                <meshStandardMaterial />
            </Circle>
            <OrbitControls target={[0, 1, 0]} />
        </Canvas>
    );
}
