import { AudioEffectPlayer } from "../../engine/audio/systems/MediaSystem";

export const handleSoundEffect = () => {
    AudioEffectPlayer.instance.play(AudioEffectPlayer.SOUNDS.ui);
};

export const isValidHttpUrl = urlString => {
    let url;

    try {
        url = new URL(urlString);
    } catch (err) {
        console.log("Err:", err.message);
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
};

export const getCanvasBlob = (canvas, fileType = "image/png", quality = 0.9) => {
    return new Promise(resolve => canvas.toBlob(resolve, fileType, quality));
};
