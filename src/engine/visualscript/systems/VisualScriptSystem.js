import { useEffect } from "react";
import { matches } from "ts-matches";

import { hasComponent, setComponent } from "../../../ecs/ComponentFunctions";
import { defineSystem } from "../../../ecs/SystemFunctions";
import { InputSystemGroup } from "../../../ecs/SystemGroups";
import { defineAction, defineActionQueue, getState } from "../../../hyperflux";
import { EngineState } from "../../../spatial/EngineState";
import { VisualScriptState } from "../../../visual-script";

import { defineQuery } from "../../../ecs";
import { registerEngineProfile } from "../nodes/profiles/ProfileModule";
import { VisualScriptComponent, VisualScriptDomain } from "../VisualScriptModule";

export const VisualScriptActions = {
    execute: defineAction({
        type: "ee.engine.VisualScript.EXECUTE",
        entity: matches.number,
    }),
    stop: defineAction({
        type: "ee.engine.VisualScript.STOP",
        entity: matches.number,
    }),
    executeAll: defineAction({
        type: "ee.engine.VisualScript.EXECUTEALL",
        entity: matches.number,
    }),
    stopAll: defineAction({
        type: "ee.engine.VisualScript.STOPALL",
        entity: matches.number,
    }),
};

export const visualScriptQuery = defineQuery([VisualScriptComponent]);

const executeQueue = defineActionQueue(VisualScriptActions.execute.matches);
const stopQueue = defineActionQueue(VisualScriptActions.stop.matches);
const execute = () => {
    if (getState(EngineState).isEditor) return;

    for (const action of executeQueue()) {
        const entity = action.entity;
        if (hasComponent(entity, VisualScriptComponent))
            setComponent(entity, VisualScriptComponent, { run: true });
    }

    for (const action of stopQueue()) {
        const entity = action.entity;
        if (hasComponent(entity, VisualScriptComponent))
            setComponent(entity, VisualScriptComponent, { run: false });
    }
};

const reactor = () => {
    useEffect(() => {
        VisualScriptState.registerProfile(registerEngineProfile, VisualScriptDomain.ECS);
    }, []);
    return null;
};

export const VisualScriptSystem = defineSystem({
    uuid: "ee.engine.VisualScriptSystem",
    insert: { with: InputSystemGroup },
    execute,
    reactor,
});
