import {
    defineComponent,
    getOptionalMutableComponent,
    useOptionalComponent,
} from "../../../ecs/ComponentFunctions";

export const ErrorComponent = defineComponent({
    name: "ErrorComponent",
    onInit: () => ({}),
});

export const getEntityErrors = (entity, component) => {
    return getOptionalMutableComponent(entity, ErrorComponent)?.[component.name].value;
};

export const useEntityErrors = (entity, component) => {
    const errors = useOptionalComponent(entity, ErrorComponent)?.[component.name];
    return errors;
};
