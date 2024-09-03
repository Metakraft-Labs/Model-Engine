export class SimulatorBase {
    mass;
    damping;
    frameTime;
    offset;
    cache = [];

    constructor(fps, mass, damping) {
        this.mass = mass;
        this.damping = damping;
        this.frameTime = 1 / fps;
        this.offset = 0;
    }

    setFPS(value) {
        this.frameTime = 1 / value;
    }

    lastFrame() {
        return this.cache[this.cache.length - 1];
    }

    /**
     * Generates frames between last simulation call and the current one
     * @param {timeStep} timeStep
     */
    generateFrames(timeStep) {
        // Update cache
        // Find out how many frames needs to be generated
        const totalTimeStep = this.offset + timeStep;
        const framesToGenerate = Math.floor(totalTimeStep / this.frameTime);
        this.offset = totalTimeStep % this.frameTime;

        // Generate simulation frames
        if (framesToGenerate > 0) {
            for (let i = 0; i < framesToGenerate; i++) {
                this.cache.push(this.getFrame(i + 1 === framesToGenerate));
            }
            this.cache = this.cache.slice(-2);
        }
    }

    getFrame(_isLastFrame) {}
    simulate(_timeStep) {}
}
