import * as THREE from 'three';
export interface CenterlineSample {
    position: THREE.Vector3;
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
    arcLength: number;
}
export interface NearestPoint {
    sampleIndex: number;
    lateralDistance: number;
    distanceAlongTrack: number;
}
export declare function findNearestOnCenterline(position: THREE.Vector3, centerlineSamples: CenterlineSample[]): NearestPoint;
export declare function isOffTrack(lateralDistance: number, trackWidth: number, tolerance?: number): boolean;
export declare function createEllipseCenterline(majorRadius: number, minorRadius: number, samples: number): CenterlineSample[];
