import { STATIC_ASSET_REGEX } from "../../../common/src/regex";
import exportModelGLTF from "../../../engine/assets/functions/exportModelGLTF";

import { uploadProjectFiles } from "./assetFunctions";

export default async function exportGLTF(entity, path) {
    const [, orgname, pName, fileName] = STATIC_ASSET_REGEX.exec(path);
    return exportRelativeGLTF(entity, `${orgname}/${pName}`, fileName);
}

export async function exportRelativeGLTF(entity, projectName, relativePath) {
    const isGLTF = /\.gltf$/.test(relativePath);
    const gltf = await exportModelGLTF(entity, {
        projectName,
        relativePath,
        binary: !isGLTF,
        embedImages: !isGLTF,
        includeCustomExtensions: true,
        onlyVisible: false,
    });
    const blob = isGLTF ? [JSON.stringify(gltf, null, 2)] : [gltf];
    const file = new File(blob, relativePath);
    const urls = await Promise.all(uploadProjectFiles(projectName, [file], [``]).promises);
    console.log("exported model data to ", ...urls);
}
