import React from "react";
import { createEngine } from "../ecs/Engine";
import { HyperFlux } from "../hyperflux";
import { startTimer } from "../spatial/startTimer";

createEngine(HyperFlux.store);
startTimer();

export default function EngineM({ children }) {
    return <>{children}</>;
}
