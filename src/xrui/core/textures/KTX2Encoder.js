import { createWorkerFromCrossOriginURL } from "../../../common/src/utils/createWorkerFromCrossOriginURL";

import { WorkerPool } from "../WorkerPool";
const workerPath = new URL("./KTX2Worker.bundle.js", import.meta.url).href;

export const UASTCFlags = {
    /** Fastest is the lowest quality, although it's stil substantially higher quality vs. BC1/ETC1. It supports 5 modes.
      /* The output may be somewhat blocky because this setting doesn't support 2/3-subset UASTC modes, but it should be less blocky vs. BC1/ETC1.
      /* This setting doesn't write BC1 hints, so BC1 transcoding will be slower. 
      /* Transcoded ETC1 quality will be lower because it only considers 2 hints out of 32.
      /* Avg. 43.45 dB
       */
    UASTCLevelFastest: 0,

    /** Faster is ~3x slower than fastest. It supports 9 modes.
      /* Avg. 46.49 dB
      */
    UASTCLevelFaster: 1,

    /** Default is ~5.5x slower than fastest. It supports 14 modes.
      /* Avg. 47.47 dB
      */
    UASTCLevelDefault: 2,

    /** Slower is ~14.5x slower than fastest. It supports all 18 modes.
      /* Avg. 48.01 dB
      */
    UASTCLevelSlower: 3,

    /** VerySlow is ~200x slower than fastest. 
      /* The best quality the codec is capable of, but you'll need to be patient or have a lot of cores.
      /* Avg. 48.24 dB
      */
    UASTCLevelVerySlow: 4,

    UASTCLevelMask: 0xf,

    /** By default the encoder tries to strike a balance between UASTC and transcoded BC7 quality.
      /** These flags allow you to favor only optimizing for lowest UASTC error, or lowest BC7 error.
      */
    UASTCFavorUASTCError: 8,
    UASTCFavorBC7Error: 16,

    UASTCETC1FasterHints: 64,
    UASTCETC1FastestHints: 128,
    UASTCETC1DisableFlipAndIndividual: 256,

    /**
     * Favor UASTC modes 0 and 10 more than the others (this is experimental, it's useful for RDO compression)
     */
    UASTCFavorSimplerModes: 512,
};

export class KTX2Encoder {
    pool = new WorkerPool(1);

    constructor() {
        this.pool.setWorkerCreator(() =>
            createWorkerFromCrossOriginURL(workerPath, false, { name: "KTX2 Encoder" }),
        );
    }

    setWorkerLimit(limit) {
        this.pool.setWorkerLimit(limit);
    }

    async encode(image, options) {
        const responseMessage = await this.pool.postMessage({ image, options }, [
            image.data.buffer,
        ]);
        if (responseMessage.data.error) throw new Error(responseMessage.data.error);
        if (!responseMessage.data.texture || responseMessage.data.texture.byteLength === 0)
            throw new Error("Encoding failed");
        return responseMessage.data.texture;
    }
}
