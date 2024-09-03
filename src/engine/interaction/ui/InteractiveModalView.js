import React from "react";

import {
    Color,
    DoubleSide,
    Mesh,
    MeshPhysicalMaterial,
    Shape,
    ShapeGeometry,
    Vector3,
} from "three";
import { createEntity, setComponent } from "../../../ecs";
import { hookstate } from "../../../hyperflux";
import { TransformComponent } from "../../../spatial";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";
import { MeshComponent } from "../../../spatial/renderer/components/MeshComponent";
import { VisibleComponent } from "../../../spatial/renderer/components/VisibleComponent";
import { EntityTreeComponent } from "../../../spatial/transform/components/EntityTree";
import { createXRUI } from "../../../spatial/xrui/functions/createXRUI";
import { useXRUIState } from "../../../spatial/xrui/functions/useXRUIState";

export const createModalView = (entity, interactMessage, isInteractable = true) => {
    const uiEntity = createEntity();
    const ui = createXRUI(
        () => InteractiveModalView(uiEntity),
        hookstate({
            interactMessage,
        }),
        { interactable: isInteractable },
        uiEntity,
    );
    return ui;
};

function createBackground(parentEntity, width, height) {
    const blurMat = new MeshPhysicalMaterial({
        color: new Color("#B9B9B9"),
        transmission: 1,
        roughness: 0.5,
        opacity: 1,
        transparent: true,
        side: DoubleSide,
    });

    const backgroundEid = createEntity();
    const calcWidth = width + 30; // 30 accounts for padding and border radius in the Element styling
    const calcHeight = height + 30;
    const mesh = new Mesh(
        roundedRect(
            -(calcWidth / 1000) / 2,
            -(calcHeight / 1000) / 2,
            calcWidth / 1000,
            calcHeight / 1000,
            0.01,
        ),
        blurMat,
    );
    setComponent(backgroundEid, EntityTreeComponent, { parentEntity: parentEntity });
    setComponent(backgroundEid, MeshComponent, mesh);
    setComponent(backgroundEid, VisibleComponent);
    const backgroundTransform = setComponent(backgroundEid, TransformComponent, {
        position: new Vector3(0, 0, -0.001),
    });
    addObjectToGroup(backgroundEid, mesh); // TODO: this should be managed by the MeshComponent
    return backgroundEid;
}

function roundedRect(x, y, width, height, radius) {
    const shape = new Shape();
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);
    return new ShapeGeometry(shape);
}

export const InteractiveModalView = entity => {
    const modalState = useXRUIState();
    const rootElement = React.useRef(null);

    React.useLayoutEffect(() => {
        if (rootElement.current) {
            createBackground(
                entity,
                rootElement.current.clientWidth,
                rootElement.current.clientHeight,
            );
        }
    }, [rootElement.current]); //TODO this isn't firing, not calculating size to add BG

    return (
        <div className={"modal"} ref={rootElement}>
            {modalState.interactMessage.value && modalState.interactMessage.value !== ""
                ? modalState.interactMessage.value
                : "E"}
            <link
                href="https://fonts.googleapis.com/css?family=Lato:400"
                rel="stylesheet"
                type="text/css"
            />
            <style>
                {`
        .modal {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 60px;
          color: #e7e7e7;
          font-family: sans-serif;
          font-weight: 400;
          border: 4px solid #e7e7e7;
          border-radius: 10px;
          padding: 10px;
          margin: 60px;
          width: fit-content;
          height: fit-content;
          min-width: 50px;
          min-height: 50px;
          text-align: center;
          vertical-align: center;
        }
      `}
            </style>
        </div>
    );
};
