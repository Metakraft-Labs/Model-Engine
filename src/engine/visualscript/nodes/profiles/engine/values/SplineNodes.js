import { UUIDComponent } from "../../../../../../ecs";
import {
    getComponent,
    getOptionalComponent,
    setComponent,
} from "../../../../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../../../../ecs/QueryFunctions";
import { defineSystem, destroySystem } from "../../../../../../ecs/SystemFunctions";
import { PresentationSystemGroup } from "../../../../../../ecs/SystemGroups";
import { SplineComponent } from "../../../../../../engine/scene/components/SplineComponent";
import { SplineTrackComponent } from "../../../../../../engine/scene/components/SplineTrackComponent";
import { NameComponent } from "../../../../../../spatial/common/NameComponent";
import {
    Assert,
    NodeCategory,
    makeAsyncNodeDefinition,
    makeFunctionNodeDefinition,
} from "../../../../../../visual-script";

const splineQuery = defineQuery([SplineComponent]);

export const getSpline = makeFunctionNodeDefinition({
    typeName: "engine/spline/getSpline",
    category: NodeCategory.Engine,
    label: "Get Spline Entity",
    in: {
        spline: _ => {
            const choices = splineQuery().map(entity => ({
                text: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
            }));
            choices.unshift({ text: "none", value: "" });
            return {
                valueType: "string",
                choices: choices,
            };
        },
    },
    out: { entity: "entity" },
    exec: ({ read, write }) => {
        const splineEntityUUID = read("spline");
        Assert.mustBeTrue(splineEntityUUID !== "", "Please select spline entity");
        const splineEntity = UUIDComponent.getEntityByUUID(splineEntityUUID);
        write("entity", splineEntity);
    },
});

let systemCounter = 0;
const initialState = () => ({
    systemUUID: "",
});
export const addSplineTrack = makeAsyncNodeDefinition({
    typeName: "engine/spline/addSplineTrack",
    category: NodeCategory.Engine,
    label: "Add spline track",
    in: {
        flow: "flow",
        entity: "entity",
        velocity: "float",
        splineUUID: "string",
        isLoop: "boolean",
        lockToXZPlane: "boolean",
        enableRotation: "boolean",
        reset: "boolean",
    },
    out: { flow: "flow", trackEnd: "flow", entity: "entity" },
    initialState: initialState(),
    triggered: ({ read, write, commit, finished }) => {
        const entity = Number(read("entity"));
        const splineUuid = read("splineUUID");
        const velocity = read("velocity");
        const isLoop = read("isLoop");
        const lockToXZPlane = read("lockToXZPlane");
        const enableRotation = read("enableRotation");
        const alpha = read("reset") ? 0 : undefined;

        setComponent(entity, SplineTrackComponent, {
            alpha: alpha,
            splineEntityUUID: splineUuid,
            velocity: velocity,
            enableRotation: enableRotation,
            lockToXZPlane: lockToXZPlane,
            loop: isLoop,
        });

        write("entity", entity);
        const systemUUID = defineSystem({
            uuid: "visual-script-spline-tracker-" + systemCounter++,
            insert: { with: PresentationSystemGroup },
            execute: () => {
                // can we hook into the spline track reactor somehow? this feels wasteful, but probably the right way to do it
                const splineTrack = getComponent(entity, SplineTrackComponent);
                if (splineTrack.loop) return;
                const splineEntity = UUIDComponent.getEntityByUUID(splineTrack.splineEntityUUID);
                if (!splineEntity) return;
                const spline = getOptionalComponent(splineEntity, SplineComponent);
                if (!spline) return;
                if (Math.floor(splineTrack.alpha) > spline.elements.length - 1) {
                    commit("trackEnd");
                    finished?.();
                    destroySystem(systemUUID); // we only want to run it once
                    return;
                }
            },
        });

        commit("flow");
        const state = {
            systemUUID,
        };

        return state;
    },
    dispose: ({ state: { systemUUID } }) => {
        if (systemUUID) destroySystem(systemUUID); // for if we shut down the vScript early
        return initialState();
    },
});

//scene transition
