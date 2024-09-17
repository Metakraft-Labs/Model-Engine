/* eslint-disable no-console */

import { EventEmitter } from "../Events/EventEmitter";

export const LogLevel = {
    Verbose: 0,
    Info: 1,
    Warning: 2,
    Error: 3,
};

export function logSeverityToLevel(severity) {
    switch (severity) {
        case "verbose":
            return LogLevel.Verbose;
        case "info":
            return LogLevel.Info;
        case "warning":
            return LogLevel.Warning;
        case "error":
            return LogLevel.Error;
    }
}
export const PrefixStyle = {
    None: 0,
    Default: 1,
    Time: 2,
};

export class Logger {
    static logLevel = LogLevel.Info;
    static prefixStyle = PrefixStyle.Default;

    static onLog = new EventEmitter();

    static {
        const prefix = () => {
            switch (Logger.prefixStyle) {
                case PrefixStyle.None:
                    return "";
                case PrefixStyle.Default:
                    return "[ee Visual Script]:";
                case PrefixStyle.Time:
                    return new Date().toLocaleTimeString().padStart(11, "0") + " ";
            }
        };

        Logger.onLog.addListener(logMessage => {
            if (Logger.logLevel > logSeverityToLevel(logMessage.severity)) return; // verbose if for in graph only

            switch (logSeverityToLevel(logMessage.severity)) {
                case LogLevel.Info:
                    console.info(prefix() + logMessage.text);
                    break;
                case LogLevel.Warning:
                    console.warn(prefix() + logMessage.text);
                    break;
                case LogLevel.Error:
                    console.error(prefix() + logMessage.text);
                    break;
            }
        });
    }

    static log(severity, text) {
        this.onLog.emit({ severity, text });
    }

    static verbose(text) {
        this.onLog.emit({ severity: "verbose", text });
    }

    static info(text) {
        this.onLog.emit({ severity: "info", text });
    }

    static warning(text) {
        this.onLog.emit({ severity: "warning", text });
    }

    static error(text) {
        this.onLog.emit({ severity: "error", text });
    }
}
