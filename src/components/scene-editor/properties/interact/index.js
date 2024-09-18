import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlinePanTool } from "react-icons/md";

import { getOptionalComponent, UUIDComponent } from "../../../../ecs";
import { getComponent, hasComponent, useComponent } from "../../../../ecs/ComponentFunctions";
import { defineQuery } from "../../../../ecs/QueryFunctions";
import {
    InteractableComponent,
    XRUIActivationType,
} from "../../../../engine/interaction/components/InteractableComponent";
import { useState } from "../../../../hyperflux";
import { CallbackComponent } from "../../../../spatial/common/CallbackComponent";
import { NameComponent } from "../../../../spatial/common/NameComponent";
import { InputComponent } from "../../../../spatial/input/components/InputComponent";
import { EntityTreeComponent } from "../../../../spatial/transform/components/EntityTree";
import Button from "../../../Button";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import InputGroup from "../../../Group";
import NumericInput from "../../../inputs/Numeric";
import StringInput from "../../../inputs/String";
import SelectInput from "../../../Select";
import BooleanInput from "../../input/Boolean";
import NodeEditor from "../nodeEditor";
import { commitProperties, commitProperty, updateProperty } from "../Util";

const callbackQuery = defineQuery([CallbackComponent]);

export const InteractableComponentNodeEditor = props => {
    const { t } = useTranslation();
    const targets = useState([
        { label: "Self", value: getComponent(props.entity, UUIDComponent), callbacks: [] },
    ]);

    const interactableComponent = useComponent(props.entity, InteractableComponent);

    useEffect(() => {
        const options = [];

        if (!hasComponent(props.entity, InputComponent)) {
            EditorControlFunctions.addOrRemoveComponent([props.entity], InputComponent, true);
        }

        const entityCallbacks = getOptionalComponent(props.entity, CallbackComponent);
        if (entityCallbacks) {
            options.push({
                label: "Self",
                value: getComponent(props.entity, UUIDComponent),
                callbacks: Object.keys(entityCallbacks).map(cb => {
                    return { label: cb, value: cb };
                }),
            });
        } else {
            options.push({
                label: "Self",
                value: "Self",
                callbacks: [],
            });
        }
        for (const entity of callbackQuery()) {
            if (entity === props.entity || !hasComponent(entity, EntityTreeComponent)) continue;
            const callbacks = getComponent(entity, CallbackComponent);
            options.push({
                label: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
                callbacks: Object.keys(callbacks).map(cb => {
                    return { label: cb, value: cb };
                }),
            });
        }
        targets.set(options);
    }, []);

    const updateLabel = value => {
        commitProperty(InteractableComponent, "label")(value);
        //this might be useful later, but xrui is not updating properly
        // const msg = value ?? ''
        // modalState.interactMessage?.set(msg)
    };
    const addCallback = () => {
        const label = "";
        const callbacks = [
            ...interactableComponent.callbacks.value,
            {
                target: "Self",
                callbackID: "",
            },
        ];
        commitProperties(
            InteractableComponent,
            { label: label, callbacks: JSON.parse(JSON.stringify(callbacks)) },
            [props.entity],
        );
    };
    const removeCallback = index => {
        const callbacks = [...interactableComponent.callbacks.value];
        callbacks.splice(index, 1);
        commitProperties(
            InteractableComponent,
            { callbacks: JSON.parse(JSON.stringify(callbacks)) },
            [props.entity],
        );
    };

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.interactable.name")}
            description={t("editor:properties.interactable.description")}
            icon={<InteractableComponentNodeEditor.iconComponent />}
        >
            <InputGroup name="Label" label={t("editor:properties.interactable.lbl-label")}>
                <StringInput
                    value={interactableComponent.label.value}
                    onChange={updateProperty(InteractableComponent, "label")}
                    onRelease={value => updateLabel(value)}
                />
            </InputGroup>

            <InputGroup name="activationType" label="Activation Type">
                <SelectInput
                    key={props.entity}
                    value={interactableComponent.uiActivationType.value}
                    options={[
                        { label: "Hover", value: XRUIActivationType.hover },
                        { label: "Proximity", value: XRUIActivationType.proximity },
                    ]}
                    onChange={commitProperty(InteractableComponent, `uiActivationType`)}
                />
            </InputGroup>

            {interactableComponent.uiActivationType.value == XRUIActivationType.proximity && (
                <InputGroup
                    name="ActivationDistance"
                    label={t("editor:properties.interactable.lbl-activationDistance")}
                >
                    <NumericInput
                        value={interactableComponent.activationDistance.value}
                        onChange={updateProperty(InteractableComponent, "activationDistance")}
                        onRelease={commitProperty(InteractableComponent, "activationDistance")}
                    />
                </InputGroup>
            )}

            {interactableComponent.uiActivationType.value == XRUIActivationType.proximity && (
                <InputGroup
                    name="ClickInteract"
                    label={t("editor:properties.interactable.lbl-clickInteract")}
                    info={t("editor:properties.interactable.info-clickInteract")}
                >
                    <BooleanInput
                        value={interactableComponent.clickInteract.value}
                        onChange={commitProperty(InteractableComponent, "clickInteract")}
                    />
                </InputGroup>
            )}

            <Button className="self-end" onClick={addCallback}>
                {t("editor:properties.interactable.lbl-addcallback")}
            </Button>

            <div id={`callback-list`}>
                {interactableComponent.callbacks.map((callback, index) => {
                    const targetOption = targets.value.find(o => o.value === callback.target.value);
                    const target = targetOption ? targetOption.value : "Self";
                    return (
                        <div key={"callback" + index} className="space-y-2">
                            <InputGroup
                                name="Target"
                                label={t("editor:properties.interactable.callbacks.lbl-target")}
                            >
                                <SelectInput
                                    key={props.entity}
                                    value={callback.target.value ?? "Self"}
                                    onChange={commitProperty(
                                        InteractableComponent,
                                        `callbacks.${index}.target`,
                                    )}
                                    options={targets.value}
                                    disabled={props.multiEdit}
                                />
                            </InputGroup>

                            <InputGroup
                                name="CallbackID"
                                label={t("editor:properties.interactable.callbacks.lbl-callbackID")}
                            >
                                {targetOption?.callbacks.length == 0 ? (
                                    <StringInput
                                        value={callback.callbackID.value}
                                        onChange={updateProperty(
                                            InteractableComponent,
                                            `callbacks.${index}.callbackID`,
                                        )}
                                        onRelease={commitProperty(
                                            InteractableComponent,
                                            `callbacks.${index}.callbackID`,
                                        )}
                                        disabled={props.multiEdit || !target}
                                    />
                                ) : (
                                    <SelectInput
                                        key={props.entity}
                                        value={callback.callbackID.value}
                                        onChange={commitProperty(
                                            InteractableComponent,
                                            `callbacks.${index}.callbackID`,
                                        )}
                                        options={
                                            targetOption?.callbacks ? targetOption.callbacks : []
                                        }
                                        disabled={props.multiEdit || !target}
                                    />
                                )}
                            </InputGroup>

                            <div className="flex justify-end">
                                <Button onClick={() => removeCallback(index)}>
                                    {t("editor:properties.interactable.lbl-removecallback")}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </NodeEditor>
    );
};

InteractableComponentNodeEditor.iconComponent = MdOutlinePanTool;

export default InteractableComponentNodeEditor;
