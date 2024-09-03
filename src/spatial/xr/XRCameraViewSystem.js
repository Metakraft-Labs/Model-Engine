import { defineSystem } from "../../ecs/SystemFunctions";

import { XRSystem } from "./XRSystem";

/** @todo - do something with camera API */

// const execute = () => {
// const xrRendererState = getState(XRRendererState)
//   if (getState(XRState).xrFrame && ReferenceSpace.localFloor) {
//     const viewer = getState(XRState).xrFrame.getViewerPose(ReferenceSpace.localFloor)
//     if (viewer) {
//       for (const view of viewer.views) {
//         // console.log('XRCamera supported:', view.camera !== null && xrRendererState.glBinding !== null)
//         if (view.camera && xrRendererState.glBinding) {
//           const cameraImage = xrRendererState.glBinding?.getCameraImage(view.camera)
//           // console.log('WebGLTexture:', cameraImage)
//         }
//       }
//     }
//   }
// }

const execute = () => {};

export const XRCameraViewSystem = defineSystem({
    uuid: "ee.engine.XRCameraViewSystem",
    insert: { with: XRSystem },
    execute,
});
