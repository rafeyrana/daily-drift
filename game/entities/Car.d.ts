import * as THREE from 'three';
import { GameMaterials } from '../materials/Materials';
export declare class Car {
    object3d: THREE.Group;
    private body;
    private wheels;
    private frontWheels;
    private readonly carLength;
    private readonly carWidth;
    private readonly carHeight;
    private readonly wheelRadius;
    private readonly wheelWidth;
    private readonly wheelBase;
    constructor(materials: GameMaterials);
    private createCarBody;
    private createWheels;
    setPose(position: {
        x: number;
        z: number;
    }, heading: number, roll?: number): void;
    updateWheelVisuals(steerAngle: number, speed: number, dt: number): void;
    getPosition(): THREE.Vector3;
    getHeading(): number;
    getCenterOfMass(): THREE.Vector3;
}
