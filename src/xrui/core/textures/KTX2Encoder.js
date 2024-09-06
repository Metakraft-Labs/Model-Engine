import { createWorkerFromCrossOriginURL } from "../../../common/src/utils/createWorkerFromCrossOriginURL";

import { WorkerPool } from "../WorkerPool";

// @ts-ignore
const workerPath = new URL("./KTX2Worker.bundle.js", import.meta.url).href;

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
