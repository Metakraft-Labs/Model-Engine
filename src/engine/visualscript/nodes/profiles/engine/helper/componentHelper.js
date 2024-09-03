import { uniqueId } from "lodash";
import { useEffect } from "react";

import {
    ComponentMap,
    getComponent,
    setComponent,
    useComponent,
} from "../../../../../../ecs/ComponentFunctions";
import { defineSystem, destroySystem } from "../../../../../../ecs/SystemFunctions";
import { InputSystemGroup } from "../../../../../../ecs/SystemGroups";
import { NameComponent } from "../../../../../../spatial/common/NameComponent";
import { TransformComponent } from "../../../../../../spatial/transform/components/TransformComponent";
import {
    makeEventNodeDefinition,
    makeFlowNodeDefinition,
    makeFunctionNodeDefinition,
    NodeCategory,
} from "../../../../../../visual-script";

import { EnginetoNodetype, getSocketType, NodetoEnginetype } from "./commonHelper";

const skipComponents = [
    TransformComponent.name, // already implemented
    "PostProcessingComponent", //needs special attention
    "AvatarAnimationComponent", // needs special attention
];

const listenerSkipComponents = [
    ...skipComponents, // needs special attention
    NameComponent.name, // use component is broken
];
export function generateComponentNodeSchema(component, withFlow = false) {
    const nodeschema = {};
    if (skipComponents.includes(component.name)) return nodeschema;
    const schema = component?.onInit(UndefinedEntity);
    if (schema === null) {
        return nodeschema;
    }
    if (schema === undefined) {
        return nodeschema;
    }
    if (typeof schema !== "object") {
        const name = component.name.replace("Component", "");
        const socketValue = getSocketType(name, schema);
        if (withFlow) nodeschema[`${name}Change`] = "flow";
        if (socketValue) nodeschema[name] = socketValue;
        return nodeschema;
    }
    for (const [name, value] of Object.entries(schema)) {
        const socketValue = getSocketType(name, value);
        if (withFlow) nodeschema[`${name}Change`] = "flow";
        if (socketValue) nodeschema[name] = socketValue;
    }
    return nodeschema;
}

export function registerComponentSetters() {
    const setters = [];
    const skipped = [];
    for (const [componentName, component] of ComponentMap) {
        if (skipComponents.includes(componentName)) {
            skipped.push(componentName);
            continue;
        }
        const inputsockets = generateComponentNodeSchema(component);
        if (Object.keys(inputsockets).length === 0) {
            skipped.push(componentName);
            continue;
        }
        const node = makeFlowNodeDefinition({
            typeName: `engine/component/${componentName}/set`,
            category: NodeCategory.Engine,
            label: `set ${componentName}`,
            in: {
                flow: "flow",
                entity: "entity",
                ...inputsockets,
            },
            out: { flow: "flow", entity: "entity" },
            initialState: undefined,
            triggered: ({ read, write, commit }) => {
                const entity = Number.parseInt(read("entity"));
                const inputs = Object.entries(node.in).splice(2);
                let values = {};
                if (inputs.length === 1) {
                    values = NodetoEnginetype(read(inputs[0][0]), inputs[0][1]);
                } else {
                    for (const [input, type] of inputs) {
                        values[input] = NodetoEnginetype(read(input), type);
                    }
                }
                setComponent(entity, component, values);
                write("entity", entity);
                commit("flow");
            },
        });
        setters.push(node);
    }
    return setters;
}

export function registerComponentGetters() {
    const getters = [];
    const skipped = [];
    for (const [componentName, component] of ComponentMap) {
        if (skipComponents.includes(componentName)) {
            skipped.push(componentName);
            continue;
        }
        const outputsockets = generateComponentNodeSchema(component);
        if (Object.keys(outputsockets).length === 0) {
            skipped.push(componentName);
            continue;
        }
        const node = makeFunctionNodeDefinition({
            typeName: `engine/component/${componentName}/get`,
            category: NodeCategory.Engine,
            label: `get ${componentName}`,
            in: {
                entity: "entity",
            },
            out: {
                entity: "entity",
                ...outputsockets,
            },
            exec: ({ read, write, graph }) => {
                const entity = Number.parseInt(read("entity"));

                const props = getComponent(entity, component);
                const outputs = Object.entries(node.out).splice(1);
                if (typeof props !== "object") {
                    write(outputs[outputs.length - 1][0], EnginetoNodetype(props));
                } else {
                    for (const [output, type] of outputs) {
                        write(output, EnginetoNodetype(props[output]));
                    }
                }
                write("entity", entity);
            },
        });
        getters.push(node);
    }
    return getters;
}

const initialState = () => ({
    systemUUID: "",
});

export function registerComponentListeners() {
    const getters = [];
    const skipped = [];
    for (const [componentName, component] of ComponentMap) {
        if (listenerSkipComponents.includes(componentName)) {
            skipped.push(componentName);
            continue;
        }
        const outputsockets = generateComponentNodeSchema(component, true);
        if (Object.keys(outputsockets).length === 0) {
            skipped.push(componentName);
            continue;
        }

        const node = makeEventNodeDefinition({
            typeName: `engine/component/${componentName}/use`,
            category: NodeCategory.Engine,
            label: `use ${componentName}`,
            in: {
                entity: "entity",
            },
            out: {
                entity: "entity",
                ...outputsockets,
            },
            initialState: initialState(),
            init: ({ read, write, commit }) => {
                const entity = Number.parseInt(read("entity"));
                const valueOutputs = Object.entries(node.out)
                    .splice(1)
                    .filter(([output, type]) => type !== "flow");
                const flowOutputs = Object.entries(node.out)
                    .splice(1)
                    .filter(([output, type]) => type === "flow");

                const systemUUID = defineSystem({
                    uuid: `visual-script-use-${componentName}` + uniqueId(),
                    insert: { with: InputSystemGroup },
                    execute: () => {},
                    reactor: () => {
                        const componentValue = useComponent(entity, component);
                        if (typeof componentValue !== "object") {
                            useEffect(() => {
                                const value = EnginetoNodetype(componentValue.value);
                                write(valueOutputs[valueOutputs.length - 1][0], value);
                                commit(flowOutputs[flowOutputs.length - 1][0]);
                            }, [componentValue]);
                        } else {
                            valueOutputs.forEach(([output, type], index) => {
                                useEffect(() => {
                                    const value = EnginetoNodetype(componentValue[output].value);
                                    const flowSocket = flowOutputs.find(
                                        ([flowOutput, flowType]) =>
                                            flowOutput === `${output}Change`,
                                    );
                                    write(output, value);
                                    commit(flowSocket[0]);
                                }, [componentValue[output]]);
                            });
                        }
                        return null;
                    },
                });

                write("entity", entity);
                const state = {
                    systemUUID,
                };

                return state;
            },
            dispose: ({ state: { systemUUID } }) => {
                destroySystem(systemUUID);
                return initialState();
            },
        });
        getters.push(node);
    }
    return getters;
}
