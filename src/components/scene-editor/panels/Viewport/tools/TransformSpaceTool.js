import React from "react";

import { TransformSpace } from "../../../../../engine/scene/constants/transformConstants";
import { getMutableState, useHookstate } from "../../../../../hyperflux";

import { Tooltip } from "@mui/material";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { PiGlobeSimple } from "react-icons/pi";
import Button from "../../../../Button";
import Select from "../../../../Select";
import { setTransformSpace, toggleTransformSpace } from "../../../functions/transformFunctions";
import { EditorHelperState } from "../../../services/EditorHelperState";

const transformSpaceOptions = [
    {
        label: t("editor:toolbar.transformSpace.lbl-selection"),
        description: t("editor:toolbar.transformSpace.info-selection"),
        value: TransformSpace.local,
    },
    {
        label: t("editor:toolbar.transformSpace.lbl-world"),
        description: t("editor:toolbar.transformSpace.info-world"),
        value: TransformSpace.world,
    },
];

const TransformSpaceTool = () => {
    const { t } = useTranslation();

    const transformSpace = useHookstate(getMutableState(EditorHelperState).transformSpace);

    return (
        <div id="transform-space" className="flex items-center">
            <Tooltip title={t("editor:toolbar.transformSpace.lbl-toggleTransformSpace")}>
                <Button
                    startIcon={<PiGlobeSimple className="text-theme-input" />}
                    onClick={toggleTransformSpace}
                    variant="transparent"
                    className="px-0"
                />
            </Tooltip>
            <Tooltip
                title={
                    transformSpace.value === TransformSpace.local
                        ? t("editor:toolbar.transformSpace.info-selection")
                        : t("editor:toolbar.transformSpace.info-world")
                }
                content={t("editor:toolbar.transformSpace.description")}
            >
                <Select
                    key={transformSpace.value}
                    inputClassName="py-1 h-6 rounded-sm text-theme-gray3 text-xs"
                    className="m-1 w-24 border-theme-input text-theme-gray3"
                    onChange={setTransformSpace}
                    options={transformSpaceOptions}
                    currentValue={transformSpace.value}
                />
            </Tooltip>
        </div>
    );
};

export default TransformSpaceTool;
