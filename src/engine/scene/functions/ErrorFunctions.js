import { isEmpty } from "lodash";

import {
    getMutableComponent,
    hasComponent,
    removeComponent,
    setComponent,
} from "../../../ecs/ComponentFunctions";
import { none } from "../../../hyperflux";

import { ErrorComponent } from "../components/ErrorComponent";

export const addError = (entity, Component, error, message) => {
    console.error("[addError]:", entity, Component.name, error, message);
    if (!hasComponent(entity, ErrorComponent)) setComponent(entity, ErrorComponent);
    const errors = getMutableComponent(entity, ErrorComponent);
    if (!errors[Component.name].value) errors[Component.name].set({});
    errors[Component.name][error].set(message ?? "");
};

export const removeError = (entity, Component, error) => {
    if (!hasComponent(entity, ErrorComponent)) return;
    const errors = getMutableComponent(entity, ErrorComponent);
    const componentErrors = errors[Component.name];
    if (componentErrors.value) componentErrors[error].set(none);
    if (isEmpty(componentErrors.value)) errors[Component.name].set(none);
    if (isEmpty(errors.value)) removeComponent(entity, ErrorComponent);
};

export const clearErrors = (entity, Component) => {
    if (!hasComponent(entity, ErrorComponent)) return;
    const errors = getMutableComponent(entity, ErrorComponent);
    errors[Component.name].set(none);
    if (isEmpty(errors.value)) removeComponent(entity, ErrorComponent);
};
