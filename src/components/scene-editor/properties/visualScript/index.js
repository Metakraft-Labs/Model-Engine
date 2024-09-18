import React from "react";

import { useComponent } from "../../../../ecs/ComponentFunctions";

import { MdIntegrationInstructions } from "react-icons/md";

import { VisualScriptComponent } from "../../../../engine";
import { BooleanInput } from "../../../Boolean";
import InputGroup from "../../../Group";
import { NodeEditor } from "../nodeEditor";
import { commitProperty } from "../Util";

export const VisualScriptNodeEditor = props => {
    const visualScriptComponent = useComponent(props.entity, VisualScriptComponent);

    return (
        <NodeEditor
            {...props}
            name={"Visual Script Component"}
            description={" Adds a visual script to the entity"}
            icon={<VisualScriptNodeEditor.iconComponent />}
        >
            <InputGroup name="Disable Visual Script" label="Disable Visual Script">
                <BooleanInput
                    value={visualScriptComponent.disabled.value}
                    onChange={commitProperty(VisualScriptComponent, "disabled")}
                />
            </InputGroup>
            <InputGroup name="Play Visual Script" label="Play Visual Script">
                <BooleanInput
                    value={visualScriptComponent.run.value}
                    onChange={commitProperty(VisualScriptComponent, "run")}
                />
            </InputGroup>
        </NodeEditor>
    );
};

VisualScriptNodeEditor.iconComponent = MdIntegrationInstructions;

export default VisualScriptNodeEditor;
