export interface InputState {
    throttle: number;
    brake: number;
    steer: number;
}
export interface InputEvents {
    brakeTap: boolean;
    feintSwitch: boolean;
}
export interface InputData {
    state: InputState;
    events: InputEvents;
}
export declare class Input {
    private keys;
    private lastTime;
    private throttleValue;
    private brakeValue;
    private steerValue;
    private readonly throttleRiseTime;
    private readonly throttleFallTime;
    private readonly brakeRiseTime;
    private readonly brakeFallTime;
    private readonly steerRiseTime;
    private readonly steerFallTime;
    private lastSteerDirection;
    private steerDirectionChangeTime;
    private lastSteerMagnitude;
    constructor();
    private setupKeys;
    attach(container: HTMLElement): void;
    detach(container: HTMLElement): void;
    private preventArrowDefaults;
    private onKeyDown;
    private onKeyUp;
    update(deltaTime: number, speed: number): InputData;
    private detectEvents;
    getInputs(): InputData;
}
