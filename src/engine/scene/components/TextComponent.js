import { useEffect } from "react";
import { Color, MathUtils, MeshBasicMaterial, MeshStandardMaterial, Vector2 } from "three";
import { Text as TroikaText } from "troika-three-text";

import { defineComponent, useComponent } from "../../../ecs/ComponentFunctions";
import { useEntityContext } from "../../../ecs/EntityFunctions";
import { matches } from "../../../hyperflux";
import { addObjectToGroup } from "../../../spatial/renderer/components/GroupComponent";

/**
 *  @description
 *  Noto Sans is the default font for text rendering.
 *  @notes troika.Text.font accepts a nullable string URI (URL or path), and defaults to Noto Sans when null is passed
 */
const FontDefault = null;

/**
 * @description Lorem Ipsum filler text
 */
const LoremIpsum =
    "Cat ipsum dolor sit amet, munch, munch, chomp, chomp go crazy with excitement when plates are clanked together signalling the arrival of cat food lounge in doorway. Rub face on everything i like to spend my days sleeping and eating fishes that my human fished for me we live on a luxurious yacht, sailing proudly under the sun, i like to walk on the deck, watching the horizon, dreaming of a good bowl of milk yet ooooh feather moving feather! for rub my belly hiss. I see a bird i stare at it i meow at it i do a wiggle come here birdy kick up litter but ignore the squirrels, you'll never catch them anyway meow in empty rooms i like big cats and i can not lie. At four in the morning wake up owner meeeeeeooww scratch at legs and beg for food then cry and yowl until they wake up at two pm jump on window and sleep while observing the bootyful cat next door that u really like but who already has a boyfriend end up making babies with her and let her move in scream at teh bath so leave hair on owner's clothes. If human is on laptop sit on the keyboard haha you hold me hooman i scratch, cough furball into food bowl then scratch owner for a new one make muffins, so kick up litter let me in let me out let me in let me out let me in let me out who broke this door anyway . See owner, run in terror cats are cute show belly and steal mom's crouton while she is in the bathroom so skid on floor, crash into wall .";

const DefaultText = "type your text here";
/**
 * @description A Text Component, used to manage the state of the NodeEditor view that customizes spatial text properties.
 */
export const TextComponent = defineComponent({
    name: "TextComponent",
    jsonID: "EE_text_spatial",

    onInit: _entity => {
        return {
            // Text contents to render
            text: DefaultText,
            textOpacity: 100, // range[0..100], sent to troika as [0..1] :number
            textWidth: Infinity,
            textIndent: 0,
            textAlign: "left",
            textWrap: true, // Maps to: troika.Text.whiteSpace as TroikaTextWrap
            textWrapKind: "normal", // Maps to troika.Text.overflowWrap
            textAnchor: new Vector2(
                /* X */ 0, // range[0..100+], sent to troika as [0..100]% :string
                /* Y */ 100, // range[0..100+], sent to troika as [0..100]% :string
            ), // lower-left by default
            textDepthOffset: 0, // For Z-fighting adjustments. Similar to anchor.Z
            textCurveRadius: 0,
            letterSpacing: 0,
            lineHeight: "normal",
            textDirection: "auto",

            // Font Properties
            font: FontDefault, // font|null
            fontSize: 0.2,
            fontColor: new Color(0xffffff),
            fontMaterial: 0, // Default to whatever value is marked at id=0 in FontMaterialKind
            // Font Outline Properties
            outlineOpacity: 0, // range[0..100], sent to troika as [0..1] :number
            outlineWidth: 0, // range[0..100+], sent to troika as [0..100]% :string
            outlineBlur: 0, // range[0..100+], sent to troika as [0..100]% :string
            outlineOffset: new Vector2(
                /* X */ 0, // range[0..100+], sent to troika as [0..100]% :string
                /* Y */ 0, // range[0..100+], sent to troika as [0..100]% :string
            ),
            outlineColor: new Color(0x000000),
            // Font Stroke Properties
            strokeOpacity: 0, // range[0..100], sent to troika as [0..1] :number
            strokeWidth: 0, // range[0..100+], sent to troika as [0..100]% :string
            strokeColor: new Color(0x444444),

            // Advanced Configuration
            textOrientation: "+x+y",
            clipActive: false, // sends []: Array to Text.clipRect when true
            clipRectMin: new Vector2(-1024, -1024), // pixels. Sent to troika as [minX, minY, maxX, maxY] :Array
            clipRectMax: new Vector2(1024, 1024), // pixels. Sent to troika as [minX, minY, maxX, maxY] :Array
            gpuAccelerated: true,
            glyphResolution: 6, // Maps to troika.Text.sdfGlyphSize. Sent to troika as 2^N :number
            glyphDetail: 1, // Maps to troika.Text.glyphGeometryDetail

            // Internal State
            troikaMesh,
        };
    },

    onSet: (entity, component, json) => {
        if (!json) return;
        // Text contents/properties
        if (matches.string.test(json.text)) component.text.set(json.text);
        if (matches.number.test(json.textOpacity)) component.textOpacity.set(json.textOpacity);
        if (matches.number.test(json.textWidth)) component.textWidth.set(json.textWidth);
        if (matches.number.test(json.textIndent)) component.textIndent.set(json.textIndent);
        if (matches.string.test(json.textAlign)) component.textAlign.set(json.textAlign);
        if (matches.boolean.test(json.textWrap)) component.textWrap.set(json.textWrap);
        if (matches.string.test(json.textWrapKind)) component.textWrapKind.set(json.textWrapKind);
        if (matches.object.test(json.textAnchor) && json.textAnchor.isVector2)
            component.textAnchor.set(json.textAnchor);
        if (matches.number.test(json.textDepthOffset))
            component.textDepthOffset.set(json.textDepthOffset);
        if (matches.number.test(json.textCurveRadius))
            component.textCurveRadius.set(json.textCurveRadius);
        if (matches.number.test(json.letterSpacing))
            component.letterSpacing.set(json.letterSpacing);
        if (
            matches.number.test(json.lineHeight) ||
            (matches.string.test(json.lineHeight) && json.lineHeight === "normal")
        )
            component.lineHeight.set(json.lineHeight);
        if (matches.string.test(json.textDirection))
            component.textDirection.set(json.textDirection);
        // Font Properties
        if (matches.string.test(json.font)) component.font.set(json.font);
        else if (matches.nill.test(json.font)) component.font.set(null);
        if (matches.number.test(json.fontSize)) component.fontSize.set(json.fontSize);

        if (matches.object.test(json.fontColor) && json.fontColor.isColor) {
            component.fontColor.set(json.fontColor);
        } else if (matches.number.test(json.fontColor)) {
            component.fontColor.set(new Color(json.fontColor));
        }

        if (matches.number.test(json.fontMaterial) && json.fontMaterial in FontMaterialKind)
            component.fontMaterial.set(json.fontMaterial);
        if (matches.number.test(json.outlineOpacity))
            component.outlineOpacity.set(json.outlineOpacity);
        if (matches.number.test(json.outlineWidth)) component.outlineWidth.set(json.outlineWidth);
        if (matches.number.test(json.outlineBlur)) component.outlineBlur.set(json.outlineBlur);
        if (matches.object.test(json.outlineOffset) && json.outlineOffset.isVector2)
            component.outlineOffset.set(json.outlineOffset);

        if (matches.object.test(json.outlineColor) && json.outlineColor.isColor) {
            component.outlineColor.set(json.outlineColor);
        } else if (matches.number.test(json.outlineColor)) {
            component.outlineColor.set(new Color(json.outlineColor));
        }

        if (matches.number.test(json.strokeOpacity))
            component.strokeOpacity.set(json.strokeOpacity);
        if (matches.number.test(json.strokeWidth)) component.strokeWidth.set(json.strokeWidth);

        if (matches.object.test(json.strokeColor) && json.strokeColor.isColor) {
            component.strokeColor.set(json.strokeColor);
        } else if (matches.number.test(json.strokeColor)) {
            component.strokeColor.set(new Color(json.strokeColor));
        }

        // Advanced configuration
        if (matches.string.test(json.textOrientation))
            component.textOrientation.set(json.textOrientation);
        if (matches.boolean.test(json.gpuAccelerated))
            component.gpuAccelerated.set(json.gpuAccelerated);
        if (matches.boolean.test(json.clipActive)) component.clipActive.set(json.clipActive);
        if (matches.object.test(json.clipRectMin) && json.clipRectMin.isVector2)
            component.clipRectMin.set(json.clipRectMin);
        if (matches.object.test(json.clipRectMax) && json.clipRectMax.isVector2)
            component.clipRectMax.set(json.clipRectMax);
        if (matches.number.test(json.glyphResolution))
            component.glyphResolution.set(json.glyphResolution);
        if (matches.number.test(json.glyphDetail)) component.glyphDetail.set(json.glyphDetail);
    },

    toJSON: (entity, component) => {
        return {
            // Text contents/properties
            text: component.text.value,
            textOpacity: component.textOpacity.value,
            textWidth: component.textWidth.value,
            textIndent: component.textIndent.value,
            textAlign: component.textAlign.value,
            textWrap: component.textWrap.value,
            textWrapKind: component.textWrapKind.value,
            textAnchor: component.textAnchor.value,
            textDepthOffset: component.textDepthOffset.value,
            textCurveRadius: component.textCurveRadius.value,
            lineHeight: component.lineHeight.value,
            letterSpacing: component.letterSpacing.value,
            textDirection: component.textDirection.value,
            // Font Properties
            font: component.font.value,
            fontSize: component.fontSize.value,
            fontColor: component.fontColor.value,
            fontMaterial: component.fontMaterial.value,
            outlineOpacity: component.outlineOpacity.value,
            outlineWidth: component.outlineWidth.value,
            outlineBlur: component.outlineBlur.value,
            outlineOffset: component.outlineOffset.value,
            outlineColor: component.outlineColor.value,
            strokeOpacity: component.strokeOpacity.value,
            strokeWidth: component.strokeWidth.value,
            strokeColor: component.strokeColor.value,
            // Advanced configuration
            textOrientation: component.textOrientation.value,
            clipActive: component.clipActive.value,
            clipRectMin: component.clipRectMin.value,
            clipRectMax: component.clipRectMax.value,
            gpuAccelerated: component.gpuAccelerated.value,
            glyphResolution: component.glyphResolution.value,
            glyphDetail: component.glyphDetail.value,
        };
    },

    reactor: function () {
        const entity = useEntityContext();
        const text = useComponent(entity, TextComponent);

        useEffect(() => {
            text.troikaMesh.set(new TroikaText());
            addObjectToGroup(entity, text.troikaMesh.value);
            return () => {
                text.troikaMesh.value.dispose();
            };
        }, []);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.text = text.text.value;
            troikaMesh.sync();
        }, [text.text]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.fillOpacity = text.textOpacity.value / 100;
            troikaMesh.sync();
        }, [text.textOpacity]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.textIndent = text.textIndent.value;
            troikaMesh.sync();
        }, [text.textIndent]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.textAlign = text.textAlign.value;
            troikaMesh.sync();
        }, [text.textAlign]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.whiteSpace = text.textWrap.value ? "normal" : "nowrap";
            troikaMesh.sync();
        }, [text.textWrap]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.overflowWrap = text.textWrapKind.value;
            troikaMesh.sync();
        }, [text.textWrapKind]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.anchorX = `${text.textAnchor.x.value}%`;
            troikaMesh.anchorY = `${text.textAnchor.y.value}%`;
            troikaMesh.sync();
        }, [text.textAnchor]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.curveRadius = MathUtils.degToRad(text.textCurveRadius.value);
            troikaMesh.sync();
        }, [text.textCurveRadius]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.depthOffset = text.textDepthOffset.value;
            troikaMesh.sync();
        }, [text.textDepthOffset]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.maxWidth = text.textWidth.value;
            troikaMesh.sync();
        }, [text.textWidth]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.lineHeight = text.lineHeight.value;
            troikaMesh.sync();
        }, [text.lineHeight]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.letterSpacing = text.letterSpacing.value;
            troikaMesh.sync();
        }, [text.letterSpacing]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.direction = text.textDirection.value;
            troikaMesh.sync();
        }, [text.textDirection]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.font = text.font.value;
            troikaMesh.sync();
        }, [text.font]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.fontSize = text.fontSize.value;
            troikaMesh.sync();
        }, [text.fontSize]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.color = text.fontColor.value.getHex();
            troikaMesh.sync();
        }, [text.fontColor]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            switch (text.fontMaterial.value) {
                case FontMaterialKind.Basic:
                    troikaMesh.material = new MeshBasicMaterial();
                    break;
                case FontMaterialKind.Standard:
                    troikaMesh.material = new MeshStandardMaterial();
                    break;
            }
            troikaMesh.sync();
        }, [text.fontMaterial]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.outlineOpacity = text.outlineOpacity.value / 100;
            troikaMesh.sync();
        }, [text.outlineOpacity]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.outlineWidth = `${text.outlineWidth.value}%`;
            troikaMesh.sync();
        }, [text.outlineWidth]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.outlineBlur = `${text.outlineBlur.value}%`;
            troikaMesh.sync();
        }, [text.outlineBlur]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.outlineOffsetX = `${text.outlineOffset.x.value}%`;
            troikaMesh.outlineOffsetY = `${text.outlineOffset.y.value}%`;
            troikaMesh.sync();
        }, [text.outlineOffset]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.outlineColor = text.outlineColor.value.getHex();
            troikaMesh.sync();
        }, [text.outlineColor]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.strokeOpacity = text.strokeOpacity.value / 100;
            troikaMesh.sync();
        }, [text.strokeOpacity]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.strokeWidth = `${text.strokeWidth.value}%`;
            troikaMesh.sync();
        }, [text.strokeWidth]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.strokeColor = text.strokeColor.value.getHex();
            troikaMesh.sync();
        }, [text.strokeColor]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.orientation = text.textOrientation.value;
            troikaMesh.sync();
        }, [text.textOrientation]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.clipRect = text.clipActive.value
                ? [
                      // Send as [minX, minY, maxX, maxY] :Array
                      text.clipRectMin.x.value,
                      text.clipRectMin.y.value,
                      text.clipRectMax.x.value,
                      text.clipRectMax.x.value,
                  ]
                : [];
            troikaMesh.sync();
        }, [text.clipActive, text.clipRectMin, text.clipRectMax]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.gpuAccelerateSDF = text.gpuAccelerated.value;
            troikaMesh.sync();
        }, [text.gpuAccelerated]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.sdfGlyphSize = Math.pow(2, text.glyphResolution.value);
            troikaMesh.sync();
        }, [text.glyphResolution]);

        useEffect(() => {
            const troikaMesh = text.troikaMesh.value;
            troikaMesh.glyphGeometryDetail = text.glyphDetail.value;
            troikaMesh.sync();
        }, [text.glyphDetail]);

        return null;
    },
});
