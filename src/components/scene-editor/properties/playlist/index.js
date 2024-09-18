import React from "react";
import { useTranslation } from "react-i18next";

import { useComponent } from "../../../../ecs/ComponentFunctions";
import { PlayMode } from "../../../../engine/scene/constants/PlayMode";

import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { IoMdAdd, IoMdPause, IoMdPlay, IoMdSkipBackward, IoMdSkipForward } from "react-icons/io";
import { MdDelete, MdDragIndicator } from "react-icons/md";
import { RiPlayList2Fill } from "react-icons/ri";
import "react-scrubber/lib/scrubber.css";
import { v4 as uuidv4 } from "uuid";
import { usePrevious } from "../../../../common/src/utils/usePrevious";
import { PlaylistComponent } from "../../../../engine/scene/components/PlaylistComponent";
import { NO_PROXY, none } from "../../../../hyperflux";
import { commitProperties, commitProperty } from "../Util";

import BooleanInput from "../../../Boolean";
import Button from "../../../Button";
import InputGroup from "../../../Group";
import { ControlledStringInput } from "../../../inputs/String";
import SelectInput from "../../../Select";
import NodeEditor from "../nodeEditor";

const PlayModeOptions = [
    {
        label: "Random",
        value: PlayMode.random,
    },
    {
        label: "Loop",
        value: PlayMode.loop,
    },
    {
        label: "SingleLoop",
        value: PlayMode.singleloop,
    },
];

const ItemType = {
    track: "track",
};

/**
 * VolumetricNodeEditor provides the editor view to customize properties.
 *
 * @param       {any} props
 * @constructor
 */
export const PlaylistNodeEditor = props => {
    const { t } = useTranslation();

    const component = useComponent(props.entity, PlaylistComponent);
    // const currentTrackIndex = useHookstate(-1)

    const addTrack = () => {
        component.tracks.merge([
            {
                uuid: uuidv4(),
                src: "",
            },
        ]);
        commitProperties(
            PlaylistComponent,
            {
                tracks: component.tracks.value,
            },
            [props.entity],
        );
    };

    const findTrack = trackUUID => {
        for (let i = 0; i < component.tracks.length; i++) {
            if (component.tracks[i].uuid.value === trackUUID) {
                return {
                    track: component.tracks[i].get(NO_PROXY),
                    index: i,
                };
            }
        }
        return {
            track: undefined,
            index: -1,
        };
    };

    const moveTrack = (trackUUID, atIndex) => {
        const { track, index } = findTrack(trackUUID);
        if (track && index !== -1) {
            component.tracks.set(arr => {
                arr.splice(index, 1);
                arr.splice(atIndex, 0, track);
                return arr;
            });
            commitProperties(
                PlaylistComponent,
                {
                    tracks: component.tracks.value,
                },
                [props.entity],
            );
        }
    };

    const [, drop] = useDrop(() => ({ accept: ItemType.track }));

    const togglePause = () => {
        component.paused.set(!component.paused.value);
    };

    return (
        <NodeEditor {...props} name="Playlist" icon={<PlaylistNodeEditor.iconComponent />}>
            <DndProvider backend={HTML5Backend}>
                <div ref={drop} className="w-full pl-4 pr-2">
                    <InputGroup name="Autoplay" label="Autoplay">
                        <BooleanInput
                            onChange={commitProperty(PlaylistComponent, "autoplay")}
                            value={component.autoplay.value}
                        />
                    </InputGroup>
                    {component.tracks.length > 0 ? (
                        <>
                            {component.tracks.value.map((track, index) => {
                                return (
                                    <Track
                                        entity={props.entity}
                                        track={component.tracks[index]}
                                        moveTrack={moveTrack}
                                        findTrack={findTrack}
                                        key={track.uuid}
                                        active={track.uuid === component.currentTrackUUID.value}
                                        onChange={() => {
                                            if (track.uuid === component.currentTrackUUID.value) {
                                                const newUUID = uuidv4();
                                                component.tracks[index].uuid.set(newUUID);
                                                commitProperties(
                                                    PlaylistComponent,
                                                    {
                                                        tracks: component.tracks.value,
                                                    },
                                                    [props.entity],
                                                );
                                                component.currentTrackUUID.set(newUUID);
                                            }
                                        }}
                                        playing={
                                            track.uuid === component.currentTrackUUID.value &&
                                            !component.paused.value
                                        }
                                        togglePlay={() => {
                                            if (track.uuid === component.currentTrackUUID.value) {
                                                component.paused.set(p => !p);
                                            } else {
                                                component.merge({
                                                    currentTrackUUID: track.uuid,
                                                    currentTrackIndex: index,
                                                    paused: false,
                                                });
                                            }
                                        }}
                                    />
                                );
                            })}

                            <div className="grid grid-cols-2 items-center gap-2">
                                <div className="col-span-1 flex items-center justify-start">
                                    <div
                                        className="text-2xl text-white"
                                        onClick={() =>
                                            PlaylistComponent.playNextTrack(props.entity, -1)
                                        }
                                    >
                                        <IoMdSkipBackward />
                                    </div>
                                    <div className="text-2xl text-white" onClick={togglePause}>
                                        {component.paused.value ? <IoMdPlay /> : <IoMdPause />}
                                    </div>
                                    <div
                                        className="text-2xl text-white"
                                        onClick={() =>
                                            PlaylistComponent.playNextTrack(props.entity, 1)
                                        }
                                    >
                                        <IoMdSkipForward />
                                    </div>
                                    <div className="text-2xl text-white" onClick={addTrack}>
                                        <IoMdAdd />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <SelectInput
                                        options={PlayModeOptions}
                                        value={component.playMode.value}
                                        onChange={commitProperty(PlaylistComponent, "playMode")}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <Button
                            size="small"
                            variant="outline"
                            className="w-full"
                            onClick={addTrack}
                        >
                            Add track
                        </Button>
                    )}
                </div>
            </DndProvider>
        </NodeEditor>
    );
};

const Track = ({ entity, track, active, playing, moveTrack, findTrack, onChange, togglePlay }) => {
    const originalIndex = findTrack(track.uuid.value).index;
    const [{ opacity }, dragSourceRef, previewRef] = useDrag({
        type: ItemType.track,
        item: { uuid: track.uuid.value, index: originalIndex },
        collect: monitor => ({
            opacity: monitor.isDragging() ? 0 : 1,
        }),
    });

    const [, connectDrop] = useDrop({
        accept: ItemType.track,
        hover({ uuid: draggedtrackUUID }) {
            if (draggedtrackUUID !== track.uuid.value) {
                const { index: overIndex } = findTrack(track.uuid.value);
                moveTrack(draggedtrackUUID, overIndex);
            }
        },
    });

    const previousTrackSource = usePrevious(track.src);

    return (
        <div
            className="flex items-center justify-between gap-1"
            ref={node => connectDrop(previewRef(node))}
        >
            <ControlledStringInput
                type="text"
                value={track.src.value}
                onRelease={e => {
                    if (e !== previousTrackSource) {
                        track.src.set(e);
                        onChange();
                    }
                }}
                className={`${active ? "border-2 border-solid border-black" : ""}`}
            />
            <div ref={dragSourceRef} className="cursor-move text-2xl text-white">
                <MdDragIndicator />
            </div>
            <div className="text-xl text-white" onClick={togglePlay}>
                {playing ? <IoMdPause /> : <IoMdPlay />}
            </div>
            <div
                className="text-2xl text-white"
                onClick={() => {
                    track.set(none);
                    PlaylistComponent.playNextTrack(entity, 0);
                }}
            >
                <MdDelete />
            </div>
        </div>
    );
};

PlaylistNodeEditor.iconComponent = RiPlayList2Fill;

export default PlaylistNodeEditor;
