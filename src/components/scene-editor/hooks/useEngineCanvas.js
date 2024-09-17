import { useEffect, useLayoutEffect } from "react";
import { getComponent } from "../../../ecs";
import { getState, useHookstate, useMutableState } from "../../../hyperflux";
import { EngineState } from "../../../spatial/EngineState";
import { destroySpatialViewer, initializeSpatialViewer } from "../../../spatial/initializeEngine";
import { RendererComponent } from "../../../spatial/renderer/WebGLRendererSystem";

export const useEngineCanvas = ref => {
    const lastRef = useHookstate(() => ref.current);

    const engineState = useMutableState(EngineState);

    useLayoutEffect(() => {
        if (ref.current !== lastRef.value) {
            lastRef.set(ref.current);
        }
    }, [ref.current]);

    useLayoutEffect(() => {
        if (!lastRef.value) return;
        if (!engineState.localFloorEntity || !engineState.originEntity) return;

        const parent = lastRef.value;

        const canvas = document.getElementById("engine-renderer-canvas");
        const originalParent = canvas.parentElement;
        initializeSpatialViewer(canvas);
        parent.appendChild(canvas);

        const observer = new ResizeObserver(() => {
            getComponent(getState(EngineState).viewerEntity, RendererComponent).needsResize = true;
        });

        observer.observe(parent);

        return () => {
            destroySpatialViewer();
            observer.disconnect();
            parent.removeChild(canvas);
            originalParent?.appendChild(canvas);
        };
    }, [lastRef.value, engineState.localFloorEntity, engineState.originEntity]);
};

export const useRemoveEngineCanvas = () => {
    useEffect(() => {
        const canvas = document.getElementById("engine-renderer-canvas");
        const parent = canvas.parentElement;
        parent?.removeChild(canvas);

        return () => {
            parent?.appendChild(canvas);
        };
    }, []);

    return null;
};
