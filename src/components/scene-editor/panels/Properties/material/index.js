import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { TextField, Tooltip } from "@mui/material";
import {
    getComponent,
    getOptionalComponent,
    hasComponent,
    removeComponent,
    setComponent,
    useComponent,
    useOptionalComponent,
    UUIDComponent,
} from "../../../../../ecs";
import { getTextureAsync } from "../../../../../engine/assets/functions/resourceLoaderHooks";
import { SourceComponent } from "../../../../../engine/scene/components/SourceComponent";
import { MaterialSelectionState } from "../../../../../engine/scene/materials/MaterialLibraryState";
import { NO_PROXY, none, useHookstate, useMutableState } from "../../../../../hyperflux";
import { NameComponent } from "../../../../../spatial/common/NameComponent";
import createReadableTexture from "../../../../../spatial/renderer/functions/createReadableTexture";
import { getDefaultType } from "../../../../../spatial/renderer/materials/constants/DefaultArgs";
import {
    MaterialPlugins,
    MaterialPrototypeComponent,
    MaterialStateComponent,
    prototypeQuery,
} from "../../../../../spatial/renderer/materials/MaterialComponent";
import {
    formatMaterialArgs,
    getMaterial,
} from "../../../../../spatial/renderer/materials/materialFunctions";
import Button from "../../../../Button";
import InputGroup from "../../../../Group";
import SelectInput from "../../../../Select";
import { EditorControlFunctions } from "../../../functions/EditorControlFunctions";
import { PanelDragContainer, PanelTitle } from "../../../layout/Panel";
import styles from "../../../layout/styles.module.scss";
import ParameterInput from "../../../properties/parameter";

const toBlobs = thumbnails => {
    const blobs = {};
    Object.entries(thumbnails).map(([k, { blob }]) => {
        blobs[k] = blob;
    });
    return blobs;
};

export function MaterialEditor(props) {
    const { t } = useTranslation();
    const prototypes = prototypeQuery().map(prototype => ({
        label: getComponent(prototype, NameComponent),
        value: prototype,
    }));

    const entity = UUIDComponent.getEntityByUUID(props.materialUUID);
    const materialComponent = useComponent(entity, MaterialStateComponent);
    const material = materialComponent.material.value;
    const thumbnails = useHookstate({});
    const textureUnloadMap = useHookstate({});
    const selectedPlugin = useHookstate(Object.keys(MaterialPlugins)[0]);

    const createThumbnail = async (field, texture) => {
        if (texture?.isTexture) {
            try {
                const blob = await createReadableTexture(texture, {
                    maxDimensions: { width: 256, height: 256 },
                    url: true,
                });
                const thumbData = {
                    src: texture.image?.src ?? "BLOB",
                    blob,
                };
                thumbnails[field].set(thumbData);
                return Promise.resolve();
            } catch (e) {
                console.warn("failed loading thumbnail: " + e);
            }
        }
    };

    const createThumbnails = async () => {
        const promises = Object.entries(material).map(([field, texture]) =>
            createThumbnail(field, texture),
        );
        return Promise.all(promises);
    };

    const checkThumbs = async () => {
        thumbnails.promised && (await thumbnails.promise);
        const thumbnailVals = thumbnails.value;
        Object.entries(thumbnailVals).map(([k, { blob }]) => {
            if (!material[k]) {
                URL.revokeObjectURL(blob);
                thumbnails[k].set(none);
            }
        });
        await Promise.all(
            Object.entries(material).map(async ([field, texture]) => {
                if (texture?.isTexture) {
                    if (
                        !thumbnails[field]?.value ||
                        thumbnails[field]?.value?.src !== texture.image?.src
                    )
                        await createThumbnail(field, texture);
                }
            }),
        );
    };

    const clearThumbs = useCallback(async () => {
        Object.values(thumbnails.value).map(({ blob }) => URL.revokeObjectURL(blob));
        thumbnails.set({});
    }, [materialComponent, materialComponent.prototypeEntity]);

    const prototypeName = useHookstate("");

    prototypeName.set(material.userData.type || material.type);

    const currentSelectedMaterial = useMutableState(MaterialSelectionState).selectedMaterial;
    const materialName = useOptionalComponent(
        UUIDComponent.getEntityByUUID(currentSelectedMaterial.value),
        NameComponent,
    );

    useEffect(() => {
        clearThumbs().then(createThumbnails).then(checkThumbs);
    }, [prototypeName, currentSelectedMaterial]);

    const prototypeEntity = materialComponent.prototypeEntity.value;
    const prototype = useComponent(prototypeEntity, MaterialPrototypeComponent);

    const shouldLoadTexture = async (value, key, parametersObject) => {
        let prop;
        if (parametersObject[key].type.value === "texture") {
            if (value) {
                const priorUnload = textureUnloadMap.get(NO_PROXY)[key];
                if (priorUnload) {
                    priorUnload();
                }
                const [texture, unload] = await getTextureAsync(value);
                textureUnloadMap.merge({ [key]: unload });
                prop = texture;
            } else {
                prop = null;
            }
        } else {
            prop = value;
        }
        return prop;
    };

    /**@todo plugin UI parameter values are autogenerated - autogenerate for prototype values rather than storing in component */
    //for each parameter type, default values
    const pluginParameters = useHookstate({});
    //for the current values of the parameters
    const pluginValues = useHookstate({});

    useEffect(() => {
        pluginValues.set({});
        pluginParameters.set({});
    }, [selectedPlugin, currentSelectedMaterial]);

    useEffect(() => {
        for (const pluginComponent of Object.values(MaterialPlugins)) {
            const component = getOptionalComponent(entity, pluginComponent);
            if (!component || pluginComponent != MaterialPlugins[selectedPlugin.value]) {
                continue;
            }
            const pluginParameterValues = {};
            Object.entries(component).map(([key, uniform]) => {
                const value = uniform.value;
                pluginParameterValues[key] = { type: getDefaultType(value), default: value };
            });
            pluginParameters.set(formatMaterialArgs(pluginParameterValues));
            for (const key in component) pluginValues[key].set(component[key].value);
            return;
        }
    }, [selectedPlugin, useOptionalComponent(entity, MaterialPlugins[selectedPlugin.value])]);
    return (
        <div className="relative flex flex-col gap-2">
            <InputGroup name="Name" label={t("editor:properties.mesh.material.name")}>
                <TextField
                    value={materialName?.value ?? ""}
                    onChange={name => {
                        setComponent(entity, NameComponent, name);
                        materialName?.set(name);
                    }}
                />
            </InputGroup>
            <InputGroup name="Source" label={t("editor:properties.mesh.material.source")}>
                <div className="border-grey-500 flex flex-row gap-2 rounded-lg border-2 border-solid bg-theme-surface-main p-1 text-xs text-white">
                    <div className="justify-cneter flex items-center align-middle">
                        <label>{t("editor:properties.mesh.material.path")}</label>
                    </div>
                    <div className="break-all">
                        {getOptionalComponent(entity, SourceComponent) ?? "None"}
                    </div>
                </div>
            </InputGroup>
            <br />
            <InputGroup name="Prototype" label={t("editor:properties.mesh.material.prototype")}>
                <SelectInput
                    value={prototypeEntity}
                    options={prototypes}
                    onChange={prototypeEntity => {
                        if (materialComponent.prototypeEntity.value)
                            materialComponent.prototypeEntity.set(prototypeEntity);
                        prototypeName.set(materialComponent.material.value.userData.type);
                    }}
                />
            </InputGroup>

            <ParameterInput
                entity={props.materialUUID}
                values={materialComponent.parameters.value}
                onChange={key => async value => {
                    const property = await shouldLoadTexture(
                        value,
                        key,
                        prototype.prototypeArguments,
                    );
                    const texture = property;
                    if (texture?.isTexture) {
                        texture.flipY = false;
                        texture.needsUpdate = true;
                    }
                    EditorControlFunctions.modifyMaterial(
                        [materialComponent.material.value.uuid],
                        materialComponent.material.value.uuid,
                        [{ [key]: property }],
                    );
                    if (materialComponent.parameters.value)
                        materialComponent.parameters[key].set(property);
                    await checkThumbs();
                }}
                onModify={() => {
                    getMaterial(materialComponent.material.value.uuid).needsUpdate = true;
                }}
                defaults={prototype.prototypeArguments.value}
                thumbnails={toBlobs(thumbnails.value)}
            />

            <br />
            <div className="border-grey-500 flex flex-row justify-between rounded-lg border-2 border-solid p-1 align-middle">
                <SelectInput
                    value={selectedPlugin.value}
                    options={Object.keys(MaterialPlugins).map(key => ({ label: key, value: key }))}
                    onChange={value => selectedPlugin.set(value)}
                />
                <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                        setComponent(entity, MaterialPlugins[selectedPlugin.value]);
                    }}
                >
                    {t("editor:properties.mesh.material.setPlugin")}
                </Button>
            </div>
            {hasComponent(entity, MaterialPlugins[selectedPlugin.value]) && (
                <div className={styles.contentContainer}>
                    <ParameterInput
                        entity={props.materialUUID}
                        values={pluginValues.value}
                        onChange={key => async value => {
                            const property = await shouldLoadTexture(value, key, pluginParameters);
                            getComponent(entity, MaterialPlugins[selectedPlugin.value])[key].value =
                                property;
                            pluginValues[key].set(property);
                        }}
                        defaults={pluginParameters.value}
                    />
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                            removeComponent(entity, MaterialPlugins[selectedPlugin.value]);
                        }}
                    >
                        Remove Plugin
                    </Button>
                </div>
            )}
        </div>
    );
}

export const MaterialPropertyTitle = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.dockableTab}>
            <PanelDragContainer>
                <PanelTitle>
                    <Tooltip title={t("editor:properties.mesh.materialProperties.info")}>
                        {t("editor:properties.mesh.materialProperties.title")}
                    </Tooltip>
                </PanelTitle>
            </PanelDragContainer>
        </div>
    );
};

export default MaterialEditor;
