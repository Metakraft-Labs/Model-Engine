import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Typography } from "@mui/material";
import { HiTrash } from "react-icons/hi2";
import { useHookstate } from "../../../../hyperflux";
import Button from "../../../Button";
import Label from "../../../Label";

const recalculateNormals = geometry => {
    geometry.computeVertexNormals();
};

export default function GeometryEditor({ geometry }) {
    if (!geometry) return null;

    const { t } = useTranslation();

    const updateGeo = useHookstate(0);

    const updateGeoData = useCallback(
        () => ({
            uuid: geometry.uuid,
            name: geometry.name,
            attributes: Object.entries(geometry.attributes).map(([attribName, attrib]) => ({
                name: attribName,
                count: attrib.count,
                itemSize: attrib.itemSize,
                normalized: attrib.normalized,
            })),
        }),
        [updateGeo],
    );

    const geoData = useHookstate(updateGeoData());
    useEffect(() => {
        geoData.set(updateGeoData());
    }, [updateGeo]);

    const deleteBufferAttribute = attribName => {
        geometry.deleteAttribute(attribName);
        updateGeo.set(updateGeo.get() + 1);
    };

    return (
        <div className="my-2 flex flex-col gap-2">
            <Button variant="primary" fullWidth onClick={() => recalculateNormals(geometry)}>
                {t("editor:properties.mesh.geometry.recalculateNormals")}
            </Button>
            {geoData.attributes.map((attribute, idx) => (
                <div
                    className="relative flex flex-col border border-gray-500 px-3 py-2"
                    key={attribute.name.value + idx}
                >
                    <Button
                        variant="transparent"
                        startIcon={<HiTrash />}
                        className="absolute right-0 top-1 text-theme-iconRed"
                        onClick={() => deleteBufferAttribute(attribute.name.value)}
                    />
                    {["name", "count", "itemSize"].map(property => (
                        <div className="flex items-center gap-2" key={property}>
                            <Label>{t(`editor:properties.mesh.geometry.${property}`)}</Label>
                            <Typography>{attribute[property].value}</Typography>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
