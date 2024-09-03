export const ABC_TO_OBJ_PADDING = 7;

export const FORMAT_TO_EXTENSION = {
    mp3: ".mp3",
    wav: ".wav",
    draco: ".drc",
    "uniform-solve": ".glb",
    ktx2: ".ktx2",
    "astc/ktx2": ".ktx2",
};

export const GeometryFormatToType = {
    draco: GeometryType.Draco,
    "uniform-solve": GeometryType.Unify,
};

export const TIME_UNIT_MULTIPLIER = 6000; // 1 second = 6000 time units

export const textureTypeToUniformKey = {
    baseColor: "map",
    normal: "normalMap",
    metallicRoughness: "metallicRoughnessMap",
    emissive: "emissiveMap",
    occlusion: "aoMap",
};
