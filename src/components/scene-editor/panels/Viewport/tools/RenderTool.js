import React from "react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "@mui/material";
import { GiWireframeGlobe } from "react-icons/gi";
import { RiArrowDownSLine } from "react-icons/ri";
import {
    TbBallBowling,
    TbInnerShadowBottom,
    TbInnerShadowBottomFilled,
    TbShadow,
} from "react-icons/tb";
import { useMutableState } from "../../../../../hyperflux";
import { RendererState } from "../../../../../spatial/renderer/RendererState";
import { RenderModes } from "../../../../../spatial/renderer/constants/RenderModes";
import BooleanInput from "../../../../Boolean";
import Button from "../../../../Button";
import InputGroup from "../../../../Group";
import { Popup } from "../../../../Popup";
import SelectInput from "../../../../Select";

export const ShadowMapResolutionOptions = [
    {
        label: "256px",
        value: 256,
    },
    {
        label: "512px",
        value: 512,
    },
    {
        label: "1024px",
        value: 1024,
    },
    {
        label: "2048px",
        value: 2048,
    },
    {
        label: "4096px (not recommended)",
        value: 4096,
    },
];

const renderModes = [
    {
        name: "Unlit",
        icon: <TbInnerShadowBottom className="text-theme-input" />,
    },
    {
        name: "Lit",
        icon: <TbInnerShadowBottomFilled className="text-theme-input" />,
    },
    { name: "Normals", icon: <TbBallBowling className="text-theme-input" /> },
    {
        name: "Wireframe",
        icon: <GiWireframeGlobe className="text-theme-input" />,
    },
    {
        name: "Shadows",
        icon: <TbShadow className="text-theme-input" />,
    },
];

const RenderModeTool = () => {
    const { t } = useTranslation();

    const rendererState = useMutableState(RendererState);
    const options = [];

    for (let key of Object.keys(RenderModes)) {
        options.push({
            label: RenderModes[key],
            value: RenderModes[key],
        });
    }

    const handlePostProcessingChange = () => {
        rendererState.usePostProcessing.set(!rendererState.usePostProcessing.value);
        rendererState.automatic.set(false);
    };

    return (
        <div className="flex items-center gap-1">
            {renderModes.map(mode => (
                <Tooltip key={mode.name} content={mode.name}>
                    <Button
                        startIcon={mode.icon}
                        variant={
                            rendererState.renderMode.value === mode.name ? "outline" : "transparent"
                        }
                        onClick={() => rendererState.renderMode.set(mode.name)}
                        className="p-2"
                    />
                </Tooltip>
            ))}
            <Popup
                trigger={
                    <Button
                        variant="transparent"
                        className="p-2"
                        startIcon={<RiArrowDownSLine />}
                    />
                }
            >
                <div className="w-52 rounded-md bg-theme-primary p-2">
                    <InputGroup
                        name="Use Post Processing"
                        label={t("editor:toolbar.render-settings.lbl-usePostProcessing")}
                        info={t("editor:toolbar.render-settings.info-usePostProcessing")}
                        containerClassName="justify-between"
                        className="w-8"
                    >
                        <BooleanInput
                            className="bg-gray-500 hover:border-0"
                            value={rendererState.usePostProcessing.value}
                            onChange={handlePostProcessingChange}
                        />
                    </InputGroup>
                    <InputGroup
                        name="Shadow Map Resolution"
                        label={t("editor:toolbar.render-settings.lbl-shadowMapResolution")}
                        info={t("editor:toolbar.render-settings.info-shadowMapResolution")}
                        containerClassName="justify-between gap-2"
                    >
                        <SelectInput
                            inputClassName="text-theme-gray3"
                            className="border-theme-input text-theme-gray3"
                            options={ShadowMapResolutionOptions}
                            value={rendererState.shadowMapResolution.value}
                            onChange={resolution =>
                                rendererState.shadowMapResolution.set(resolution)
                            }
                            disabled={rendererState.renderMode.value !== RenderModes.SHADOW}
                        />
                    </InputGroup>
                </div>
            </Popup>
        </div>
    );
};

export default RenderModeTool;
