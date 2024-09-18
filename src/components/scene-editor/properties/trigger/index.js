import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GiTriggerHurt } from "react-icons/gi";
import { HiPlus, HiTrash } from "react-icons/hi2";
import {
    UUIDComponent,
    defineQuery,
    getComponent,
    hasComponent,
    useComponent,
} from "../../../../ecs";
import { useHookstate } from "../../../../hyperflux";
import { CallbackComponent } from "../../../../spatial/common/CallbackComponent";
import { NameComponent } from "../../../../spatial/common/NameComponent";
import { ColliderComponent } from "../../../../spatial/physics/components/ColliderComponent";
import { RigidBodyComponent } from "../../../../spatial/physics/components/RigidBodyComponent";
import { TriggerComponent } from "../../../../spatial/physics/components/TriggerComponent";
import { CollisionGroups } from "../../../../spatial/physics/enums/CollisionGroups";
import { Shapes } from "../../../../spatial/physics/types/PhysicsTypes";
import {
    EntityTreeComponent,
    useAncestorWithComponent,
} from "../../../../spatial/transform/components/EntityTree";
import Button from "../../../Button";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import InputGroup from "../../../Group";
import StringInput from "../../../inputs/String";
import SelectInput from "../../../Select";
import { SelectionState } from "../../services/SelectionServices";
import NodeEditor from "../nodeEditor";
import { commitProperties, commitProperty, updateProperty } from "../Util";

const callbackQuery = defineQuery([CallbackComponent]);

const TriggerProperties = props => {
    const { t } = useTranslation();
    const targets = useHookstate([{ label: "Self", value: "", callbacks: [] }]);

    const triggerComponent = useComponent(props.entity, TriggerComponent);
    const hasRigidbody = useAncestorWithComponent(props.entity, RigidBodyComponent);

    useEffect(() => {
        if (!hasComponent(props.entity, ColliderComponent)) {
            const nodes = SelectionState.getSelectedEntities();
            EditorControlFunctions.addOrRemoveComponent(nodes, ColliderComponent, true, {
                shape: Shapes.Sphere,
                collisionLayer: CollisionGroups.Trigger,
                collisionMask: CollisionGroups.Avatars,
            });
        }

        const options = [];
        options.push({
            label: "Self",
            value: "",
            callbacks: [],
        });
        for (const entity of callbackQuery()) {
            if (entity === props.entity || !hasComponent(entity, EntityTreeComponent)) continue;
            const callbacks = getComponent(entity, CallbackComponent);
            options.push({
                label: getComponent(entity, NameComponent),
                value: getComponent(entity, UUIDComponent),
                callbacks: Object.keys(callbacks).map(cb => ({ label: cb, value: cb })),
            });
        }
        targets.set(options);
    }, []);

    return (
        <NodeEditor
            {...props}
            name={t("editor:properties.trigger.name")}
            description={t("editor:properties.trigger.description")}
            icon={<TriggerProperties.iconComponent />}
        >
            <div className="my-3 flex justify-end">
                {!hasRigidbody && (
                    <Button
                        title={t("editor:properties.triggerVolume.lbl-addRigidBody")}
                        startIcon={<HiPlus />}
                        className="text-sm text-[#8B8B8D]"
                        onClick={() => {
                            const nodes = SelectionState.getSelectedEntities();
                            EditorControlFunctions.addOrRemoveComponent(
                                nodes,
                                RigidBodyComponent,
                                true,
                                { type: "fixed" },
                            );
                        }}
                    >
                        {t("editor:properties.triggerVolume.lbl-addRigidBody")}
                    </Button>
                )}
            </div>
            <div className="my-3 flex justify-end">
                <Button
                    variant="transparent"
                    title={t("editor:properties.triggerVolume.lbl-addTrigger")}
                    startIcon={<HiPlus />}
                    className="text-sm text-[#8B8B8D]"
                    onClick={() => {
                        const triggers = [
                            ...triggerComponent.triggers.value,
                            {
                                target: "",
                                onEnter: "",
                                onExit: "",
                            },
                        ];
                        commitProperties(
                            TriggerComponent,
                            { triggers: JSON.parse(JSON.stringify(triggers)) },
                            [props.entity],
                        );
                    }}
                />
            </div>
            {triggerComponent.triggers.map((trigger, index) => {
                const targetOption = targets.value.find(o => o.value === trigger.target.value);
                const target = targetOption ? targetOption.value : "";
                return (
                    <div className="-ml-4 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)] bg-[#1A1A1A] pb-1.5">
                        <Button
                            variant="transparent"
                            title={t("editor:properties.triggerVolume.lbl-removeTrigger")}
                            startIcon={<HiTrash />}
                            className="ml-auto text-sm text-[#8B8B8D]"
                            onClick={() => {
                                const triggers = [...triggerComponent.triggers.value];
                                triggers.splice(index, 1);
                                commitProperties(
                                    TriggerComponent,
                                    { triggers: JSON.parse(JSON.stringify(triggers)) },
                                    [props.entity],
                                );
                            }}
                        />
                        <InputGroup
                            name="Target"
                            label={t("editor:properties.triggerVolume.lbl-target")}
                        >
                            <SelectInput
                                value={trigger.target.value ?? ""}
                                onChange={commitProperty(
                                    TriggerComponent,
                                    `triggers.${index}.target`,
                                )}
                                options={targets.value.map(({ label, value }) => ({
                                    label,
                                    value,
                                }))}
                                disabled={props.multiEdit}
                            />
                        </InputGroup>
                        <InputGroup
                            name="On Enter"
                            label={t("editor:properties.triggerVolume.lbl-onenter")}
                        >
                            {targetOption?.callbacks.length ? (
                                <SelectInput
                                    value={trigger.onEnter.value}
                                    onChange={commitProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onEnter`,
                                    )}
                                    options={
                                        targetOption?.callbacks
                                            ? targetOption.callbacks.slice()
                                            : []
                                    }
                                    disabled={props.multiEdit || !target}
                                />
                            ) : (
                                <StringInput
                                    value={trigger.onEnter.value}
                                    onChange={updateProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onEnter`,
                                    )}
                                    onRelease={commitProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onEnter`,
                                    )}
                                    disabled={props.multiEdit || !target}
                                    className="bg-[#212226]"
                                />
                            )}
                        </InputGroup>

                        <InputGroup
                            name="On Exit"
                            label={t("editor:properties.triggerVolume.lbl-onexit")}
                        >
                            {targetOption?.callbacks.length ? (
                                <SelectInput
                                    value={trigger.onExit.value}
                                    onChange={commitProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onExit`,
                                    )}
                                    options={
                                        targetOption?.callbacks
                                            ? targetOption.callbacks.slice()
                                            : []
                                    }
                                    disabled={props.multiEdit || !target}
                                />
                            ) : (
                                <StringInput
                                    value={trigger.onExit.value}
                                    onRelease={updateProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onExit`,
                                    )}
                                    onChange={commitProperty(
                                        TriggerComponent,
                                        `triggers.${index}.onExit`,
                                    )}
                                    disabled={props.multiEdit || !target}
                                    className="bg-[#212226]"
                                />
                            )}
                        </InputGroup>
                    </div>
                );
            })}
        </NodeEditor>
    );
};

TriggerProperties.iconComponent = GiTriggerHurt;
export default TriggerProperties;
