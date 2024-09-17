import { EventEmitter } from "./EventEmitter";

export class CustomEvent {
    label = "";
    metadata = {};
    eventEmitter = new EventEmitter();

    constructor(_id, _name, _parameters = []) {}
}
