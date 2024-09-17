import React from "react";

import { TransformPivot } from "../../../../../engine/scene/constants/transformConstants";
import { getMutableState, useHookstate } from "../../../../../hyperflux";

import { Tooltip } from "@mui/material";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { FaRegDotCircle } from "react-icons/fa";
import Button from "../../../../Button";
import Select from "../../../../Select";
import { setTransformPivot, toggleTransformPivot } from "../../../functions/transformFunctions";
import { EditorHelperState } from "../../../services/EditorHelperState";

const transformPivotOptions = [
    {
        label: t("editor:toolbar.transformPivot.lbl-selection"),
        description: t("editor:toolbar.transformPivot.info-selection"),
        value: TransformPivot.Selection,
    },
    {
        label: t("editor:toolbar.transformPivot.lbl-center"),
        description: t("editor:toolbar.transformPivot.info-center"),
        value: TransformPivot.Center,
    },
    {
        label: t("editor:toolbar.transformPivot.lbl-bottom"),
        description: t("editor:toolbar.transformPivot.info-bottom"),
        value: TransformPivot.Bottom,
    },
    {
        label: t("editor:toolbar.transformPivot.lbl-origin"),
        description: t("editor:toolbar.transformPivot.info-origin"),
        value: TransformPivot.Origin,
    },
];

const TransformPivotTool = () => {
    const { t } = useTranslation();

    const editorHelperState = useHookstate(getMutableState(EditorHelperState));

    return (
        <div id="transform-pivot" className="flex items-center">
            <Tooltip title={t("editor:toolbar.transformPivot.toggleTransformPivot")}>
                <Button
                    startIcon={<FaRegDotCircle className="text-theme-input" />}
                    onClick={toggleTransformPivot}
                    variant="transparent"
                    className="px-0"
                />
            </Tooltip>
            <Tooltip
                content={
                    transformPivotOptions.find(
                        pivot => pivot.value === editorHelperState.transformPivot.value,
                    )?.description
                }
            >
                <Select
                    key={editorHelperState.transformPivot.value}
                    inputClassName="py-1 h-6 rounded-sm text-theme-gray3 text-xs"
                    className="m-1 w-28 border-theme-input text-theme-gray3"
                    onChange={setTransformPivot}
                    options={transformPivotOptions}
                    currentValue={editorHelperState.transformPivot.value}
                />
            </Tooltip>
        </div>
    );
};

export default TransformPivotTool;
