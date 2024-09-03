import { hasComponent } from "../../ecs/ComponentFunctions";
import { ECSState } from "../../ecs/ECSState";
import { getState } from "../../hyperflux";
import {
    checkBitflag,
    NetworkObjectSendPeriodicUpdatesTag,
    readComponentProp,
    readUint8,
    rewindViewCursor,
    spaceUint8,
    writePropIfChanged,
} from "../../network";

import { AvatarIKTargetComponent } from "./components/AvatarIKComponents";

export const readBlendWeight = (v, entity) => {
    const changeMask = readUint8(v);
    let b = 0;
    if (checkBitflag(changeMask, 1 << b++))
        readComponentProp(v, AvatarIKTargetComponent.blendWeight, entity);
};

export const writeBlendWeight = (v, entity) => {
    const rewind = rewindViewCursor(v);
    const writeChangeMask = spaceUint8(v);
    let changeMask = 0;
    let b = 0;

    const ignoreHasChanged =
        hasComponent(entity, NetworkObjectSendPeriodicUpdatesTag) &&
        Math.round(
            getState(ECSState).simulationTime % getState(ECSState).periodicUpdateFrequency,
        ) === 0;

    changeMask |= writePropIfChanged(
        v,
        AvatarIKTargetComponent.blendWeight,
        entity,
        ignoreHasChanged,
    )
        ? 1 << b++
        : b++ && 0;

    return (changeMask > 0 && writeChangeMask(changeMask)) || rewind();
};

export const IKSerialization = {
    ID: "ee.engine.avatar.ik",
    readBlendWeight,
    writeBlendWeight,
};
