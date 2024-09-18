import { getComponent, removeComponent } from "../../../../../../ecs/ComponentFunctions";
import { defineQuery, removeQuery } from "../../../../../../ecs/QueryFunctions";
import { defineSystem, destroySystem } from "../../../../../../ecs/SystemFunctions";
import { CollisionComponent } from "../../../../../../spatial/physics/components/CollisionComponent";
import { PhysicsSystem } from "../../../../../../spatial/physics/PhysicsModule";
import { makeEventNodeDefinition, NodeCategory } from "../../../../../../visual-script";

let systemCounter = 0;

// define initial state based on a type
const initialState = () => ({
    query: undefined,
    systemUUID: "",
});

// a visual script node
export const OnCollision = makeEventNodeDefinition({
    typeName: "engine/onCollision",
    category: NodeCategory.Engine,
    label: "Collision Events",

    // socket configuration support
    configuration: {},

    // flow node inputs
    in: {
        entity: "entity",
    },

    out: {
        flow: "flow",
        entity: "entity",
        target: "entity",
    },

    initialState: initialState(),

    init: ({ read, write, commit }) => {
        const entityFilter = read("entity");
        const query = defineQuery([CollisionComponent]);

        // @todo this could be moved to a global system
        // @todo this could be using useComponent although that is asynchronous

        const systemUUID = defineSystem({
            uuid: "visual-script-onCollision-" + systemCounter++,
            insert: { after: PhysicsSystem },
            execute: () => {
                const results = query();
                for (const entity of results) {
                    if (entityFilter && entityFilter != entity) continue;
                    // const name = getComponent(entity, NameComponent);
                    const collision = getComponent(entity, CollisionComponent);
                    // @todo maybe there should be that delay timer hack?
                    for (const [e] of collision) {
                        write("entity", entity);
                        write("target", e);
                        commit("flow", () => {});
                    }
                    // @todo this should be done in the physics engine rather than here - hack
                    removeComponent(entity, CollisionComponent);
                }
            },
        });

        const state = {
            query,
            systemUUID,
        };

        return state;
    },
    dispose: ({ state: { query, systemUUID } }) => {
        destroySystem(systemUUID);
        removeQuery(query);
        return initialState();
    },
});
