export function extractParameters(parameters) {
    if (!parameters.enabled) return {};
    if (typeof parameters.parameters === "object" && !Array.isArray(parameters.parameters)) {
        return Object.fromEntries(
            Object.entries(parameters.parameters).map(([key, value]) => {
                if (value.isParameterOverride) {
                    if (value.enabled) return [key, extractParameters(value)];
                    else return [];
                } else return [key, value];
            }),
        );
    } else if (Array.isArray(parameters.parameters)) {
        return [
            ...parameters.parameters.map(value => {
                if (value.isParameterOverride) {
                    if (value.enabled) return [extractParameters(value)];
                    else return [];
                } else return [value];
            }),
        ];
    } else return parameters.parameters;
}

export const DefaultModelTransformParameters = {
    src: "",
    dst: "",
    resourceUri: "",
    modelFormat: "gltf",
    split: true,
    combineMaterials: true,
    instance: true,
    dedup: true,
    flatten: true,
    join: {
        enabled: true,
        options: {
            keepMeshes: false,
            keepNamed: false,
        },
    },
    palette: {
        enabled: false,
        options: {
            blockSize: 4,
            min: 2,
        },
    },
    prune: true,
    reorder: true,
    resample: true,
    weld: {
        enabled: false,
        tolerance: 0.001,
    },
    meshoptCompression: {
        enabled: true,
    },
    dracoCompression: {
        enabled: false,
        options: {
            method: "sequential",
            encodeSpeed: 0,
            decodeSpeed: 0,
            quantizePosition: 14,
            quantizeNormal: 8,
            quantizeColor: 8,
            quantizeTexcoord: 12,
            quantizeGeneric: 16,
            quantizationVolume: "mesh",
        },
    },
    textureFormat: "ktx2",
    textureCompressionType: "etc1",
    uastcLevel: 4,
    compLevel: 4,
    maxCodebooks: true,
    flipY: false,
    linear: true,
    mipmap: true,
    textureCompressionQuality: 128,
    maxTextureSize: 1024,
    simplifyRatio: 1.0,
    simplifyErrorThreshold: 0.001,
    resources: {
        geometries: [],
        images: [],
    },
};
