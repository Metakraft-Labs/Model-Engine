import { useHookstate } from "@hookstate/core";
import React, { useEffect } from "react";
import LoadingView from "../../components/LoadingView";
import "../../components/scene-editor/EditorModule";
import { createEngine } from "../../ecs";
import { getMutableState, HyperFlux } from "../../hyperflux";
import { EngineState } from "../../spatial/EngineState";
import { startTimer } from "../../spatial/startTimer";
import EditorPage from "./EditorPage";

createEngine(HyperFlux.store);
startTimer();

export const useStudioEditor = () => {
    const engineReady = useHookstate(false);

    useEffect(() => {
        if (Engine.instance) {
            getMutableState(EngineState).isEditor.set(true);
            getMutableState(EngineState).isEditing.set(true);
            engineReady.set(true);
        }
    }, [Engine.instance]);

    return engineReady.value;
};

export default function SceneEditor() {
    const ready = useStudioEditor();

    if (!ready)
        return <LoadingView fullScreen className="block h-12 w-12" title={"Loading Studio"} />;
    return <EditorPage />;
}
