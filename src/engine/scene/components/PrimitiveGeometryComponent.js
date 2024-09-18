import { useLayoutEffect } from "react";
import { MeshLambertMaterial } from "three";

import { defineComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { useMeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { GeometryTypeToFactory } from "../constants/GeometryTypeEnum";

const createGeometry = (geometryType, geometryParams) => {
    const factory = GeometryTypeToFactory[geometryType];
    const geometry = factory(geometryParams);
    return geometry;
};

export const PrimitiveGeometryComponent = defineComponent({
    name: "PrimitiveGeometryComponent",
    jsonID: "EE_primitive_geometry",

    onInit: _entity => {
        return {
            geometryType: "BoxGeometry",
            geometryParams: {},
        };
    },

    toJSON: (_entity, component) => {
        return {
            geometryType: component.geometryType.value,
            geometryParams: component.geometryParams.value,
        };
    },

    onSet: (_entity, component, json) => {
        if (!json) return;
        if (typeof json.geometryType === "number") component.geometryType.set(json.geometryType);
        if (typeof json.geometryParams === "object")
            component.geometryParams.set(json.geometryParams);
    },

    reactor: () => {
        const entity = useEntityContext();
        const geometryComponent = useComponent(entity, PrimitiveGeometryComponent);
        const mesh = useMeshComponent(
            entity,
            () =>
                createGeometry(
                    geometryComponent.geometryType.value,
                    geometryComponent.geometryParams.value,
                ),
            () => new MeshLambertMaterial(),
        );

        useLayoutEffect(() => {
            mesh.geometry.set(
                createGeometry(
                    geometryComponent.geometryType.value,
                    geometryComponent.geometryParams.value,
                ),
            );
        }, [geometryComponent.geometryType, geometryComponent.geometryParams]);

        return null;
    },
});
