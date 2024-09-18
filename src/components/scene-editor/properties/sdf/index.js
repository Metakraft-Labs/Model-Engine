import React from "react";

import { GiExplosionRays } from "react-icons/gi";
import { useComponent } from "../../../../ecs/ComponentFunctions";
import { SDFComponent, SDFMode } from "../../../../engine/scene/components/SDFComponent";
import BooleanInput from "../../../Boolean";
import ColorInput from "../../../Color";
import InputGroup from "../../../Group";
import Vector3Input from "../../../inputs/Vector3";
import SelectInput from "../../../Select";
import NodeEditor from "../nodeEditor";
import { commitProperty } from "../Util";

export const SDFEditor = props => {
    const sdfComponent = useComponent(props.entity, SDFComponent);

    return (
        <NodeEditor
            {...props}
            name={"SDF"}
            description={"Raymarching--torus and fog"}
            icon={<SDFEditor.iconComponent />}
        >
            <InputGroup name="Add Pass" label={"add pass to postprocess"}>
                <BooleanInput
                    value={sdfComponent.enable.value}
                    onChange={commitProperty(SDFComponent, "enable")}
                />
            </InputGroup>
            <InputGroup name="Mode" label="Mode">
                <SelectInput
                    value={sdfComponent.mode.value}
                    options={[
                        { label: "torus", value: SDFMode.TORUS },
                        { label: "fog", value: SDFMode.FOG },
                    ]}
                    onChange={commitProperty(SDFComponent, "mode")}
                />
            </InputGroup>
            <InputGroup name="Color" label="Color">
                <ColorInput
                    value={sdfComponent.color.value}
                    onChange={commitProperty(SDFComponent, "color")}
                    onRelease={commitProperty(SDFComponent, "color")}
                />
            </InputGroup>
            <InputGroup name="Scale" label="Scale">
                <Vector3Input
                    value={sdfComponent.scale.value}
                    onChange={commitProperty(SDFComponent, "scale")}
                />
            </InputGroup>
        </NodeEditor>
    );
};
SDFEditor.iconComponent = GiExplosionRays;
export default SDFEditor;
