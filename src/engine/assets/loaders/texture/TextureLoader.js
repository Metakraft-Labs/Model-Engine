import { ImageLoader, Texture } from "three";
import { iOS } from "../../../../spatial/common/functions/isMobile";
import { Loader } from "../base/Loader";

const iOSMaxResolution = 1024;

/** @todo make this accessible for performance scaling */
const getScaledTextureURI = async (src, maxResolution) => {
    return new Promise(async resolve => {
        const img = new Image();
        img.crossOrigin = "anonymous"; //browser will yell without this
        img.src = src;
        await img.decode(); //new way to wait for image to load
        // Initialize the canvas and it's size
        const canvas = document.createElement("canvas"); //dead dom elements? Remove after Three loads them
        const ctx = canvas.getContext("2d");

        // Set width and height
        const originalWidth = img.width;
        const originalHeight = img.height;

        let resizingFactor = 1;
        if (originalWidth >= originalHeight) {
            if (originalWidth > maxResolution) {
                resizingFactor = maxResolution / originalWidth;
            }
        } else {
            if (originalHeight > maxResolution) {
                resizingFactor = maxResolution / originalHeight;
            }
        }

        const canvasWidth = originalWidth * resizingFactor;
        const canvasHeight = originalHeight * resizingFactor;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw image and export to a data-uri
        ctx?.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        const dataURI = canvas.toDataURL();

        // Do something with the result, like overwrite original
        resolve([dataURI, canvas]);
    });
};

class TextureLoader extends Loader {
    maxResolution;

    constructor(maxResolution, manager) {
        super(manager);
        if (maxResolution) this.maxResolution = maxResolution;
        else if (iOS) this.maxResolution = iOSMaxResolution;
    }

    async load(url, onLoad, onProgress, onError, signal) {
        let canvas = undefined;
        if (this.maxResolution) {
            [url, canvas] = await getScaledTextureURI(url, this.maxResolution);
        }

        const texture = new Texture();

        const loader = new ImageLoader(this.manager)
            .setCrossOrigin(this.crossOrigin)
            .setPath(this.path);
        loader.load(
            url,
            image => {
                texture.image = image;
                texture.needsUpdate = true;
                if (canvas) canvas.remove();
                onLoad(texture);
            },
            onProgress,
            onError,
        );
    }
}

export { TextureLoader };
