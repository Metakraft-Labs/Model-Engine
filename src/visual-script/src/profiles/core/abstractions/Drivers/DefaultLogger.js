/* eslint-disable class-methods-use-this */
import { Logger } from "../../../../VisualScriptModule";

export class DefaultLogger {
    log(severity, text) {
        Logger.log(severity, text);
    }
}
