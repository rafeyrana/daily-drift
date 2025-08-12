import * as THREE from 'three';
import { CenterlineSample } from './TrackUtil';
export interface TrackMeshes {
    trackMesh: THREE.Mesh;
    startLineMesh: THREE.Mesh;
    wallsGroup: THREE.Group | null;
    centerlineSamples: CenterlineSample[];
}
export declare function createOvalTrack(majorRadius: number, minorRadius: number, width: number, samples: number, enableWalls?: boolean): TrackMeshes;
