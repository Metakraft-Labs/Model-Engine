import { EventEmitter } from "./EventEmitter";

export class CustomEvent {
    label = "";
    metadata = {};
    eventEmitter = new EventEmitter();

    constructor(id, name, parameters = []) {}
}
