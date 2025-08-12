import * as THREE from 'three';
export interface GameMaterials {
    asphalt: THREE.Material;
    grass: THREE.Material;
    carBody: THREE.Material;
    carWheel: THREE.Material;
    startLine: THREE.Material;
    wall: THREE.Material;
}
export declare function createMaterials(): GameMaterials;
export declare function disposeMaterials(materials: GameMaterials): void;
