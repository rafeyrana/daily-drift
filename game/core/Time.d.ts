export declare class FixedTimeStep {
    private accumulator;
    private lastTime;
    private readonly fixedStep;
    private readonly maxSubSteps;
    constructor(fixedStep?: number, maxSubSteps?: number);
    update(currentTime: number, callback: (dt: number) => void): number;
    reset(): void;
}
