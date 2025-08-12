export class FixedTimeStep {
    accumulator = 0;
    lastTime = 0;
    fixedStep;
    maxSubSteps;
    constructor(fixedStep = 1 / 120, maxSubSteps = 5) {
        this.fixedStep = fixedStep;
        this.maxSubSteps = maxSubSteps;
    }
    update(currentTime, callback) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return 0;
        }
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, this.fixedStep * this.maxSubSteps);
        this.lastTime = currentTime;
        this.accumulator += deltaTime;
        let steps = 0;
        while (this.accumulator >= this.fixedStep && steps < this.maxSubSteps) {
            callback(this.fixedStep);
            this.accumulator -= this.fixedStep;
            steps++;
        }
        // Return interpolation alpha for rendering
        return this.accumulator / this.fixedStep;
    }
    reset() {
        this.accumulator = 0;
        this.lastTime = 0;
    }
}
//# sourceMappingURL=Time.js.map