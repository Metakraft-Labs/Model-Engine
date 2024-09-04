import { validateNodeRegistry } from "./Nodes/Validation/validateNodeRegistry";
import { validateValueRegistry } from "./Values/Validation/validateValueRegistry";

export function validateRegistry(registry) {
    const errorList = [];
    errorList.push(...validateValueRegistry(registry.values), ...validateNodeRegistry(registry));
    return errorList;
}
