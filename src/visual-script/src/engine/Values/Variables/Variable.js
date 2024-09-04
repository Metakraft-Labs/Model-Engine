import { EventEmitter } from "../../Events/EventEmitter";

export class Variable {
    value;
    label = "";
    metadata = {};
    version = 0; // this is updated on each change to the variable state.
    onChanged = new EventEmitter();

    constructor(
        id,
        name,
        valueTypeName,
        initialValue, // this is assumed to be properly deseriealized from a string.
    ) {
        this.value = this.initialValue;
    }

    get() {
        return this.value;
    }

    set(newValue) {
        if (newValue !== this.value) {
            this.value = newValue;
            this.version++;
            this.onChanged.emit(this);
        }
    }
}
