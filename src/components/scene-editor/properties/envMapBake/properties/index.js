import React from "react";

import { EnvMapBakeComponent } from "../../../../../engine/scene/components/EnvMapBakeComponent";
import { EnvMapBakeRefreshTypes } from "../../../../../engine/scene/types/EnvMapBakeRefreshTypes";
import { EnvMapBakeTypes } from "../../../../../engine/scene/types/EnvMapBakeTypes";

import { BakePropertyTypes } from "..";
import BooleanInput from "../../../../Boolean";
import InputGroup from "../../../../Group";
import Vector3Input from "../../../../inputs/Vector3";
import SelectInput from "../../../../Select";
import { commitProperty, updateProperty } from "../../Util";

const envMapBakeSelectTypes = [
    {
        label: "Runtime",
        value: EnvMapBakeTypes.Realtime,
    },
    {
        label: "Baked",
        value: EnvMapBakeTypes.Baked,
    },
];

const envMapBakeRefreshSelectTypes = [
    {
        label: "On Awake",
        value: EnvMapBakeRefreshTypes.OnAwake,
    },
    // {
    //     label:"Every Frame",
    //     value: EnvMapBakeRefreshTypes.EveryFrame,
    // }
];

const bakeResolutionTypes = [
    {
        label: "128",
        value: 128,
    },
    {
        label: "256",
        value: 256,
    },
    {
        label: "512",
        value: 512,
    },
    {
        label: "1024",
        value: 1024,
    },
    {
        label: "2048",
        value: 2048,
    },
];

export const EnvMapBakeProperties = props => {
    const getPropertyValue = option => props.bakeComponent[option];

    let renderVal = <></>;
    const label = props.element.label;
    const propertyName = props.element.propertyName;

    switch (props.element.type) {
        case BakePropertyTypes.Boolean:
            renderVal = (
                <BooleanInput
                    value={getPropertyValue(propertyName)}
                    onChange={commitProperty(EnvMapBakeComponent, propertyName)}
                />
            );
            break;
        case BakePropertyTypes.BakeType:
            renderVal = (
                <SelectInput
                    key={props.entity}
                    options={envMapBakeSelectTypes}
                    onChange={commitProperty(EnvMapBakeComponent, propertyName)}
                    value={getPropertyValue(propertyName)}
                />
            );
            break;

        case BakePropertyTypes.RefreshMode:
            renderVal = (
                <SelectInput
                    key={props.entity}
                    options={envMapBakeRefreshSelectTypes}
                    onChange={commitProperty(EnvMapBakeComponent, propertyName)}
                    value={getPropertyValue(propertyName)}
                />
            );
            break;

        case BakePropertyTypes.Resolution:
            renderVal = (
                <SelectInput
                    key={props.entity}
                    options={bakeResolutionTypes}
                    onChange={commitProperty(EnvMapBakeComponent, propertyName)}
                    value={getPropertyValue(propertyName)}
                />
            );
            break;

        case BakePropertyTypes.Vector:
            renderVal = (
                <Vector3Input
                    onChange={updateProperty(EnvMapBakeComponent, propertyName)}
                    onRelease={commitProperty(EnvMapBakeComponent, propertyName)}
                    value={getPropertyValue(propertyName)}
                />
            );
            break;

        default:
            renderVal = <div>Undefined value Type</div>;
            break;
    }

    return (
        <InputGroup name={label} label={label}>
            {renderVal}
        </InputGroup>
    );
};

export default EnvMapBakeProperties;
