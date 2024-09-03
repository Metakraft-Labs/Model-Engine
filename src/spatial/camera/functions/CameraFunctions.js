import { getOptionalComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { TargetCameraRotationComponent } from "../components/TargetCameraRotationComponent";

export const setTargetCameraRotation = (entity, phi, theta, time = 0.3) => {
    const cameraRotationTransition = getOptionalComponent(entity, TargetCameraRotationComponent);
    if (!cameraRotationTransition) {
        setComponent(entity, TargetCameraRotationComponent, {
            phi: phi,
            phiVelocity: { value: 0 },
            theta: theta,
            thetaVelocity: { value: 0 },
            time: time,
        });
    } else {
        cameraRotationTransition.phi = phi;
        cameraRotationTransition.theta = theta;
        cameraRotationTransition.time = time;
    }
};
