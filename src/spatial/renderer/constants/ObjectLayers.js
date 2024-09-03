export const ObjectLayers = {
    // anything loaded as a scene entity
    Scene: 0,

    // intersect with camera raycast
    Camera: 1,

    // for portal effect rendering & hiding the scene
    Portal: 2,

    // avatars
    Avatar: 3,

    // other gizmos (ik targets, infinite grid, origin)
    Gizmos: 4,

    // XRUI, loading screen envmap mesh
    UI: 5,

    // used to hide objects from studio screenshot/texture baking
    PhysicsHelper: 6,
    AvatarHelper: 7,
    NodeHelper: 8,

    // custom threejs scene in a UI panel
    Panel: 9,

    // transform gizmo
    TransformGizmo: 10,

    // transform gizmo
    HighlightEffect: 11,

    UVOL: 30,
};

export const ObjectLayerMasks = {
    Scene: 1 << ObjectLayers.Scene,
    Camera: 1 << ObjectLayers.Camera,
    Portal: 1 << ObjectLayers.Portal,
    Avatar: 1 << ObjectLayers.Avatar,
    Gizmos: 1 << ObjectLayers.Gizmos,
    UI: 1 << ObjectLayers.UI,
    PhysicsHelper: 1 << ObjectLayers.PhysicsHelper,
    AvatarHelper: 1 << ObjectLayers.AvatarHelper,
    NodeHelper: 1 << ObjectLayers.NodeHelper,
    Panel: 1 << ObjectLayers.Panel,
    TransformGizmo: 1 << ObjectLayers.TransformGizmo,
    HighlightEffect: 1 << ObjectLayers.HighlightEffect,
    UVOL: 1 << ObjectLayers.UVOL,
};
