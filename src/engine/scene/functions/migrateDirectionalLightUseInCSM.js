import { DirectionalLightComponent } from "../../../spatial";

import { RenderSettingsComponent } from "../components/RenderSettingsComponent";

export const migrateDirectionalLightUseInCSM = json => {
    const renderSettingsEntity = Object.entries(json.entities).find(([, entity]) =>
        entity.components.find(c => c.name === RenderSettingsComponent.jsonID),
    );
    const directionalLightEntity = Object.entries(json.entities).find(([, entity]) =>
        entity.components.find(
            c => c.name === DirectionalLightComponent.jsonID && c.props.useInCSM === true,
        ),
    );
    if (!renderSettingsEntity || !directionalLightEntity) return;

    const directionalLightComponent = directionalLightEntity[1].components.find(
        c => c.name === DirectionalLightComponent.jsonID,
    ).props;
    const renderSettingsComponent = renderSettingsEntity[1].components.find(
        c => c.name === RenderSettingsComponent.jsonID,
    ).props;

    renderSettingsComponent.primaryLight = directionalLightEntity[0];

    /** @ts-ignore */
    delete directionalLightComponent.useInCSM;
};
