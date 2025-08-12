import { InputEvents, InputState } from '../core/Input';
export declare enum DriftState {
    Grip = "grip",
    Initiation = "initiation",
    Drift = "drift",
    Recovery = "recovery"
}
export interface DriftEffects {
    rearGripMultiplier: number;
    frontGripMultiplier: number;
    yawTorque: number;
}
export interface DriftStatus {
    state: DriftState;
    isDrifting: boolean;
    driftAngle: number;
}
export declare class DriftController {
    private state;
    private stateTimer;
    private yawImpulse;
    private yawImpulseTimer;
    private readonly initiationDuration;
    private readonly recoveryThreshold;
    private readonly idleExitThreshold;
    private readonly gripMultipliers;
    private readonly driftAngleThreshold;
    private readonly exitAngleThreshold;
    private readonly maxDriftAngle;
    private lastInputs;
    private idleTimer;
    update(deltaTime: number, inputs: InputState, events: InputEvents, speed: number, driftAngle: number): DriftEffects;
    private handleGripState;
    private handleInitiationState;
    private handleDriftState;
    private handleRecoveryState;
    private checkBrakeTapInitiation;
    private checkPowerOverInitiation;
    private checkFeintInitiation;
    private initiateBreakTap;
    private initiatePowerOver;
    private initiateFeint;
    private transitionTo;
    private getRearGripMultiplier;
    private getFrontGripMultiplier;
    private calculateEffects;
    getStatus(driftAngle: number): DriftStatus;
}
