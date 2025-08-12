import * as THREE from 'three';
export declare class TextureGenerator {
    private static cache;
    static generateAsphaltBase(): THREE.Texture;
    static generateAsphaltNormal(): THREE.Texture;
    static generateAsphaltRoughness(): THREE.Texture;
    static generateGrassBase(): THREE.Texture;
    static generateRumbleBase(): THREE.Texture;
    static generateCloudAlpha(): THREE.Texture;
    static generateFenceAlpha(): THREE.Texture;
    static dispose(): void;
}
