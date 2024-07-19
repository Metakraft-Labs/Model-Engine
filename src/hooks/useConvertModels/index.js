import { useLoader } from "@react-three/fiber";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { PLYExporter } from "three/addons/exporters/PLYExporter.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { generateUUID } from "three/src/math/MathUtils.js";

export default function useConvertModels(glbUrl) {
    const modelGlb = useLoader(GLTFLoader, glbUrl);

    const toGLTF = async () => {
        const exporter = new GLTFExporter();

        const model = await exporter.parseAsync(modelGlb?.scene);
        const buffer = new Buffer.from(JSON.stringify(model));

        const blob = new Blob([buffer], { type: "model/gltf+json" });
        const objectUrl = URL.createObjectURL(blob);

        // create <a> element dynamically
        let fileLink = document.createElement("a");
        fileLink.href = objectUrl;
        fileLink.download = `gltf-${generateUUID()}.gltf`;
        fileLink.click();
    };

    const toOBJ = () => {
        const exporter = new OBJExporter();

        const model = exporter.parse(modelGlb?.scene || modelGlb);

        const blob = new Blob([model], { type: "model/obj" });
        const objectUrl = URL.createObjectURL(blob);

        // create <a> element dynamically
        let fileLink = document.createElement("a");
        fileLink.href = objectUrl;
        fileLink.download = `obj-${generateUUID()}.obj`;
        fileLink.click();
    };

    const toPLY = () => {
        const exporter = new PLYExporter();

        const model = exporter.parse(modelGlb?.scene);

        const blob = new Blob([model], { type: "text/plain" });
        const objectUrl = URL.createObjectURL(blob);

        // create <a> element dynamically
        let fileLink = document.createElement("a");
        fileLink.href = objectUrl;
        fileLink.download = `ply-${generateUUID()}.ply`;
        fileLink.click();
    };

    const toSTL = () => {
        const exporter = new STLExporter();

        const model = exporter.parse(modelGlb?.scene);

        const blob = new Blob([model], { type: "model/stl" });
        const objectUrl = URL.createObjectURL(blob);

        // create <a> element dynamically
        let fileLink = document.createElement("a");
        fileLink.href = objectUrl;
        fileLink.download = `stl-${generateUUID()}.stl`;
        fileLink.click();
    };

    return {
        toGLTF,
        toOBJ,
        toPLY,
        toSTL,
        modelGlb,
    };
}
