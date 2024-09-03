import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";

import fragmentShader from "./glsl/antialiasing/fxaa.frag";

/**
 * FXAA effect.
 */

export class FXAAEffect extends Effect {
    resolution;

    /**
     * Constructs a new FXAA effect.
     *
     * @param {Object} [options] - The options.
     * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
     */

    constructor({ blendFunction = BlendFunction.NORMAL } = {}) {
        super("FXAAEffect", fragmentShader, {
            blendFunction,

            uniforms: new Map([
                ["tDiffuse", new Uniform(null)],
                ["resolution", new Uniform(new Vector2())],
            ]),
        });

        /**
         * The original resolution.
         *
         * @type {Vector2}
         * @private
         */
        this.resolution = new Vector2();
    }

    update(renderer, inputBuffer, deltaTime) {
        this.uniforms.get("tDiffuse").value = inputBuffer;
    }

    /**
     * Updates the size of this pass.
     *
     * @param {Number} width - The width.
     * @param {Number} height - The height.
     */
    setSize(width, height) {
        // console.log('FXAAEffect.setSize', width, height, 1/width, 1/height);
        this.resolution.set(width, height);
        this.uniforms.get("resolution").value.set(1 / width, 1 / height);
    }
}
