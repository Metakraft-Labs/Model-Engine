import { Box } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import Title from "../../shared/Title";

export default function Text2Scene() {
    const sceneRef = useRef(null);

    // const sceneJson = {
    //     area_name: "Reception",
    //     X: 0.0,
    //     Y: 0.0,
    //     Z: 0.0,
    //     area_size_X: 700,
    //     area_size_Z: 1000,
    //     area_objects_list: [
    //         {
    //             object_name: "Comfortable_Armchair_1",
    //             X: -200,
    //             Y: 0.0,
    //             Z: 150,
    //         },
    //         {
    //             object_name: "Comfortable_Armchair_2",
    //             X: -200,
    //             Y: 0.0,
    //             Z: -150,
    //         },
    //         {
    //             object_name: "Spacious_Sofa",
    //             X: 250,
    //             Y: 0.0,
    //             Z: 0,
    //         },
    //         {
    //             object_name: "Modern_Coffee_Table",
    //             X: 0,
    //             Y: 0.0,
    //             Z: 0,
    //         },
    //     ],
    // };

    useEffect(() => {
        const scene = new Scene();
        const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        const renderer = new WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        sceneRef.current.appendChild(renderer.domElement);

        function animate() {
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
    });

    return (
        <>
            <Title title="Text 2 Scene" />

            <Box ref={sceneRef}></Box>
        </>
    );
}
