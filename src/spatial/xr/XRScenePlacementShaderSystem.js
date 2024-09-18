import React, { useEffect } from "react";

import { defineSystem } from "../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../ecs/SystemGroups";
import { getMutableState, useHookstate } from "../../hyperflux";

import { GroupQueryReactor } from "../renderer/components/GroupComponent";
import { MeshComponent } from "../renderer/components/MeshComponent";
import { VisibleComponent } from "../renderer/components/VisibleComponent";
import { XRState } from "./XRState";

const addShaderToObject = obj => {
    if (obj.material) {
        if (!obj.material.userData) obj.material.userData = {};
        const userData = obj.material.userData;
        if (!userData.ScenePlacement) {
            userData.ScenePlacement = {
                previouslyTransparent: obj.material.transparent,
                previousOpacity: obj.material.opacity,
            };
        }
        obj.material.transparent = true;
        obj.material.opacity = 0.3;
        obj.material.needsUpdate = true;
    }
};

const removeShaderFromObject = obj => {
    if (obj.material) {
        const userData = obj.material.userData;
        if (userData?.ScenePlacement) {
            obj.material.transparent = userData.ScenePlacement.previouslyTransparent;
            obj.material.opacity = userData.ScenePlacement.previousOpacity;
            delete userData.ScenePlacement;
        }
    }
};

/**
 * Updates materials with scene object placement opacity shader
 * @param world
 * @returns
 */

function XRScenePlacementReactor({ obj }) {
    const xrState = getMutableState(XRState);
    const scenePlacementMode = useHookstate(xrState.scenePlacementMode).value;
    const sessionActive = useHookstate(xrState.sessionActive).value;

    useEffect(() => {
        if (scenePlacementMode !== "placing" || !sessionActive) return;

        addShaderToObject(obj);
        return () => {
            removeShaderFromObject(obj);
        };
    }, [scenePlacementMode, sessionActive]);

    return null;
}

const reactor = () => {
    return (
        <GroupQueryReactor
            GroupChildReactor={XRScenePlacementReactor}
            Components={[VisibleComponent, MeshComponent]}
        />
    );
};

export const XRScenePlacementShaderSystem = defineSystem({
    uuid: "ee.engine.XRScenePlacementShaderSystem",
    insert: { after: PresentationSystemGroup },
    reactor,
});
