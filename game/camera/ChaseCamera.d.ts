import * as THREE from 'three';
export interface CameraTarget {
    position: THREE.Vector3;
    heading: number;
    speed: number;
    steerInput: number;
    driftAngle: number;
}
export declare class ChaseCamera {
    private camera;
    private currentPosition;
    private currentLookAt;
    private currentBank;
    private readonly baseDistance;
    private readonly baseHeight;
    private readonly naturalFrequency;
    private readonly dampingRatio;
    private readonly maxBank;
    private readonly lookAheadDistance;
    private positionVelocity;
    private lookAtVelocity;
    private bankVelocity;
    constructor(camera: THREE.PerspectiveCamera, distance?: number, height?: number);
    update(deltaTime: number, target: CameraTarget): void;
    private calculateTargetPosition;
    private calculateTargetLookAt;
    private calculateTargetBank;
    private updateSpringDamper;
    private updateSpringDamperScalar;
    private applyCameraTransform;
    reset(position: THREE.Vector3, heading: number): void;
}
