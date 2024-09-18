import React, { Fragment, useEffect } from "react";
import { DisplayP3ColorSpace, LinearSRGBColorSpace, SRGBColorSpace, Vector2 } from "three";

import { AssetType } from "../../../common/src/constants/AssetType";
import { AssetLoader } from "../../../engine/assets/classes/AssetLoader";
import { ImageFileTypes, VideoFileTypes } from "../../../engine/assets/constants/fileTypes";
import { useHookstate } from "../../../hyperflux";

import Button from "../../Button";
import InputGroup from "../../Group";
import { ItemTypes } from "../../scene-editor/constants/AssetTypes";
import SelectInput from "../../Select";
import FileBrowserInput from "../FileBrowser";
import { ImageContainer } from "../Image/Preview";
import { Vector2Input } from "../Vector2";

/**
 * VideoInput used to render component view for video inputs.
 */
export function TextureInput({ ...rest }) {
    return (
        <FileBrowserInput
            acceptFileTypes={[...ImageFileTypes, ...VideoFileTypes]}
            acceptDropItems={[...ItemTypes.Images, ...ItemTypes.Videos]}
            {...rest}
        />
    );
}

export default function TexturePreviewInput({ value, onRelease, ...rest }) {
    const { preview, onModify } = rest;
    const validSrcValue =
        typeof value === "string" &&
        [AssetType.Image, AssetType.Video].includes(AssetLoader.getAssetClass(value));

    const srcState = useHookstate(value);
    const texture = srcState.value;
    const src = srcState.value;
    const showPreview = preview !== undefined || validSrcValue;
    const previewSrc = validSrcValue ? value : preview;
    const inputSrc = validSrcValue
        ? value
        : texture?.isTexture
          ? texture.source?.data?.src ?? texture?.userData?.src ?? (preview ? "BLOB" : "")
          : src;
    const offset = useHookstate(
        typeof texture?.offset?.clone === "function" ? texture.offset.clone() : new Vector2(0, 0),
    );
    const scale = useHookstate(
        typeof texture?.repeat?.clone === "function" ? texture.repeat.clone() : new Vector2(1, 1),
    );
    const colorspace = useHookstate(
        texture?.colorSpace ? texture?.colorSpace : new String(LinearSRGBColorSpace),
    );
    const uvChannel = useHookstate(texture?.channel ?? 0);

    useEffect(() => {
        if (texture?.isTexture && !value) {
            srcState.set(null);
        } else if (srcState.value !== value) {
            srcState.set(value);
        }
    }, [value]);

    useEffect(() => {
        if (texture?.isTexture && !texture.isRenderTargetTexture) {
            offset.set(texture.offset);
            scale.set(texture.repeat);
            colorspace.set(texture.colorSpace);
            uvChannel.set(texture.channel);
        }
    }, [srcState]);

    return (
        <ImageContainer>
            <div className="flex w-full flex-col items-start justify-start gap-1 rounded bg-neutral-800 p-1">
                {showPreview && (
                    <div className="relative h-full max-h-[274px] w-full max-w-[305px]">
                        <div className="flex max-h-[274px] max-w-[305px] justify-center rounded bg-zinc-900">
                            <div className="h-auto w-auto rounded bg-neutral-900">
                                <Fragment>
                                    {(typeof preview === "string" ||
                                        (typeof value === "string" &&
                                            AssetLoader.getAssetClass(value) ===
                                                AssetType.Image)) && (
                                        <img
                                            src={previewSrc}
                                            className="h-full w-full rounded object-contain"
                                            alt=""
                                            crossOrigin="anonymous"
                                        />
                                    )}
                                    {typeof value === "string" &&
                                        AssetLoader.getAssetClass(value) === AssetType.Video && (
                                            <video
                                                src={previewSrc}
                                                className="h-full w-full rounded object-contain"
                                            />
                                        )}
                                </Fragment>
                            </div>
                        </div>
                    </div>
                )}
                <div className="inline-flex items-end justify-center gap-2.5 self-stretch rounded bg-neutral-900 px-2 py-1">
                    <TextureInput value={inputSrc} onRelease={onRelease} />
                </div>
                {texture?.isTexture && !texture.isRenderTargetTexture && (
                    <>
                        <Vector2Input
                            value={offset.value}
                            onChange={_offset => {
                                offset.set(_offset);
                                texture.offset.copy(_offset);
                            }}
                            uniformScaling={false}
                        />
                        <Vector2Input
                            value={scale.value}
                            onChange={_scale => {
                                scale.set(_scale);
                                texture.repeat.copy(_scale);
                            }}
                            uniformScaling={false}
                        />
                    </>
                )}
                {texture?.isTexture && (
                    <>
                        <InputGroup name="Encoding" label="Encoding">
                            <SelectInput
                                value={colorspace.value}
                                options={[
                                    { label: "Linear", value: LinearSRGBColorSpace },
                                    { label: "sRGB", value: SRGBColorSpace },
                                    { label: "displayP3", value: DisplayP3ColorSpace },
                                ]}
                                onChange={value => {
                                    colorspace.set(value);
                                    texture.colorSpace = value;
                                    texture.needsUpdate = true;
                                    console.log("DEBUG changed space", texture.colorSpace);
                                }}
                            />
                        </InputGroup>
                        <InputGroup name="UV Channel" label="UV Channel">
                            <SelectInput
                                value={uvChannel.value}
                                options={[
                                    { label: "UV", value: 0 },
                                    { label: "UV2", value: 1 },
                                    { label: "UV3", value: 2 },
                                    { label: "UV4", value: 3 },
                                ]}
                                onChange={value => {
                                    uvChannel.set(value);
                                    texture.channel = value;
                                    texture.needsUpdate = true;
                                    onModify?.();
                                }}
                            />
                        </InputGroup>
                    </>
                )}
                {value && (
                    <>
                        <div>
                            <Button
                                onClick={() => {
                                    onRelease("");
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </ImageContainer>
    );
}

export function TexturePreviewInputGroup({ name, label, value, onRelease, ...rest }) {
    return (
        <InputGroup name={name} label={label} {...rest}>
            <TexturePreviewInput value={value} onRelease={onRelease} />
        </InputGroup>
    );
}
