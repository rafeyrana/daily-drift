import { InputState } from '../core/Input';
import { DriftEffects } from './DriftController';
export interface PhysicsParams {
    wheelBase: number;
    mass: number;
    cgToFront: number;
    cgToRear: number;
    maxSteer: number;
    engineForce: number;
    brakeForce: number;
    dragCoeff: number;
    frontalArea: number;
    airDensity: number;
    rollingResistance: number;
    baseFrontGrip: number;
    baseRearGrip: number;
    yawInertia: number;
    lateralDamping: number;
}
export interface CarKinematics {
    position: {
        x: number;
        z: number;
    };
    velocity: {
        x: number;
        z: number;
    };
    heading: number;
    angularVelocity: number;
    speed: number;
    driftAngle: number;
    velocityHeading: number;
}
export declare class CarPhysics {
    private params;
    private position;
    private velocity;
    private heading;
    private angularVelocity;
    private speed;
    private driftAngle;
    private velocityHeading;
    constructor(params: PhysicsParams);
    step(deltaTime: number, controls: InputState, driftEffects: DriftEffects): void;
    private applyLongitudinalAndResistiveForces;
    private applyLateralDynamics;
    private calculateLateralForce;
    getKinematics(): CarKinematics;
    setPose(x: number, z: number, heading: number): void;
    getSteerAngle(steerInput: number): number;
}
