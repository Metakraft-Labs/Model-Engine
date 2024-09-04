import { EventEmitter } from "../../../../VisualScriptModule";

export class ManualLifecycleEventEmitter {
    startEvent = new EventEmitter();
    endEvent = new EventEmitter();
    tickEvent = new EventEmitter();
}
