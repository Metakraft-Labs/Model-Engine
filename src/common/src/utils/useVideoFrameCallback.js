import { useEffect } from "react";

export const useVideoFrameCallback = (video, callback) => {
    useEffect(() => {
        if (!video) return;

        let frameId = -1;
        const requestFrame = video.requestVideoFrameCallback?.bind(video) ?? requestAnimationFrame;
        const cancelFrame = video.cancelVideoFrameCallback?.bind(video) ?? cancelAnimationFrame;

        const callbackFrame = (now, metadata) => {
            const videoTime = metadata?.mediaTime ?? video.currentTime;
            callback(videoTime, metadata);
            frameId = requestFrame(callbackFrame);
        };

        frameId = requestFrame(callbackFrame);
        console.log({ frameId });

        return () => cancelFrame(frameId);
    }, [video]);
};
