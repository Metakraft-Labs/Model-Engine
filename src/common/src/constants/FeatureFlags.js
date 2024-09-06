export const FeatureFlags = {
    Client: {
        Menu: {
            Social: "ir.client.menu.social",
            Emote: "ir.client.menu.emote",
            Avaturn: "ir.client.menu.avaturn",
            ReadyPlayerMe: "ir.client.menu.readyPlayerMe",
            CreateAvatar: "ir.client.menu.createAvatar",
            MotionCapture: "ir.client.location.menu.motionCapture",
            XR: "ir.client.menu.xr",
        },
    },
    Studio: {
        Model: {
            Dereference: "ir.studio.model.dereference",
            GLTFTransform: "ir.studio.model.gltfTransform",
        },
        Panel: {
            VisualScript: "ir.editor.panel.visualScript",
        },
        UI: {
            TransformPivot: "ir.editor.ui.transformPivot",
            Hierarchy: {
                ShowModelChildren: "ir.editor.ui.hierarchy.showModelChildren",
            },
        },
    },
};
