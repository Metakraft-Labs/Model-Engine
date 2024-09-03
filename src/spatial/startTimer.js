import { ECSState, Timer, executeSystems } from "../ecs";
import { getMutableState } from "../hyperflux";
import { XRState } from "./xr/XRState";

export const startTimer = () => {
    const timer = Timer((time, xrFrame) => {
        getMutableState(XRState).xrFrame.set(xrFrame);
        executeSystems(time);
        getMutableState(XRState).xrFrame.set(null);
    });
    getMutableState(ECSState).timer.set(timer);
    timer.start();
};
