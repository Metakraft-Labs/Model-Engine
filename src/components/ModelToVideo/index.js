import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import React, { useEffect, useMemo, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const ModelToVideo = ({ url }) => {
    const { scene } = useLoader(GLTFLoader, url);
    const copiedScene = useMemo(() => scene.clone(), [scene]);
    const [rotation, setRotation] = useState([0, 0, 0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prevRotation => [
                prevRotation[0], // Increment x rotation by 0.01 radians
                prevRotation[1] + 0.01, // Keep y rotation same
                prevRotation[2], // Keep z rotation same
            ]);
        }, 20);

        return () => clearInterval(interval);
    }, []);

    return (
        <Canvas camera={{ position: [0, 1, -2] }} shadows id="share-canvas">
            {/* eslint-disable react/no-unknown-property */}
            <directionalLight position={[3.3, 1.0, 4.4]} castShadow intensity={Math.PI * 2} />
            <directionalLight position={[3.3, 1.0, -4.4]} castShadow intensity={Math.PI * 2} />
            <directionalLight position={[-3.3, 1.0, 0]} castShadow intensity={Math.PI * 2} />
            {/* eslint-disable react/no-unknown-property */}
            <primitive
                object={copiedScene}
                position={[0, 1, 0]}
                children-0-castShadow
                scale={2}
                rotation={rotation}
            />
            <OrbitControls
                target={[0, 1, 0]}
                enableZoom={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 2}
                enableRotate={false}
            />
        </Canvas>
    );
};
