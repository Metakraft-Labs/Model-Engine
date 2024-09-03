import { getContentType } from "../../../../../../common/src/utils/getContentType";
import { UndefinedEntity } from "../../../../../../ecs/Entity";
import { PositionalAudioComponent } from "../../../../../../engine/audio/components/PositionalAudioComponent";
import { ImageComponent } from "../../../../../../engine/scene/components/ImageComponent";
import { MediaComponent } from "../../../../../../engine/scene/components/MediaComponent";
import { ModelComponent } from "../../../../../../engine/scene/components/ModelComponent";
import { VideoComponent } from "../../../../../../engine/scene/components/VideoComponent";
import { VolumetricComponent } from "../../../../../../engine/scene/components/VolumetricComponent";

import { addEntityToScene } from "./entityHelper";

export async function addMediaComponent(url, parent = UndefinedEntity, before = UndefinedEntity) {
    const contentType = (await getContentType(url)) || "";
    const { hostname } = new URL(url);
    let newEntity = UndefinedEntity;
    if (contentType.startsWith("model/")) {
        newEntity = addEntityToScene(
            [{ name: ModelComponent.jsonID, props: { src: url } }],
            parent,
            before,
        );
    } else if (
        contentType.startsWith("video/") ||
        hostname.includes("twitch.tv") ||
        hostname.includes("youtube.com")
    ) {
        newEntity = addEntityToScene(
            [
                { name: VideoComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
            ],
            parent,
            before,
        );
    } else if (contentType.startsWith("image/")) {
        newEntity = addEntityToScene(
            [{ name: ImageComponent.jsonID, props: { source: url } }],
            parent,
            before,
        );
    } else if (contentType.startsWith("audio/")) {
        newEntity = addEntityToScene(
            [
                { name: PositionalAudioComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
            ],
            parent,
            before,
        );
    } else if (url.includes(".uvol")) {
        newEntity = addEntityToScene(
            [
                { name: VolumetricComponent.jsonID },
                { name: MediaComponent.jsonID, props: { resources: [url] } },
            ],
            parent,
            before,
        );
    }
    return newEntity;
}
