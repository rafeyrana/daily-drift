import * as THREE from 'three';
import { TextureGenerator } from '../assets/TextureGenerator';
import { GameOptions } from '../index';

export interface GameMaterials {
  asphalt: THREE.Material;
  grass: THREE.Material;
  carBody: THREE.Material;
  carWheel: THREE.Material;
  startLine: THREE.Material;
  wall: THREE.Material;
  rumble: THREE.Material;
  fence: THREE.Material;
  carWindow: THREE.Material;
}

export function createMaterials(options: GameOptions): GameMaterials {
  // Generate procedural textures
  const asphaltBaseTexture = TextureGenerator.generateAsphaltBase();
  const asphaltNormalTexture = TextureGenerator.generateAsphaltNormal();
  const asphaltRoughnessTexture = TextureGenerator.generateAsphaltRoughness();
  const grassBaseTexture = TextureGenerator.generateGrassBase();
  const rumbleTexture = TextureGenerator.generateRumbleBase();
  const fenceAlphaTexture = TextureGenerator.generateFenceAlpha();
  
  // Configure texture repeats
  asphaltBaseTexture.repeat.set(options.asphaltRepeatU, options.asphaltRepeatV);
  asphaltNormalTexture.repeat.set(options.asphaltRepeatU, options.asphaltRepeatV);
  asphaltRoughnessTexture.repeat.set(options.asphaltRepeatU, options.asphaltRepeatV);
  grassBaseTexture.repeat.set(options.grassRepeatU, options.grassRepeatV);
  
  // NASCAR asphalt track surface - PBR material
  const asphalt = new THREE.MeshStandardMaterial({
    map: asphaltBaseTexture,
    normalMap: asphaltNormalTexture,
    roughnessMap: asphaltRoughnessTexture,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  
  // Infield grass material
  const grass = new THREE.MeshStandardMaterial({
    map: grassBaseTexture,
    roughness: 0.8,
    metalness: 0.0
  });
  
  // Stock car body material (glossy with livery color)
  const carBody = new THREE.MeshStandardMaterial({
    color: options.bodyColor,
    roughness: 0.1,
    metalness: 0.0,
    envMapIntensity: 0.5
  });
  
  // Car wheel/tire material (dark with some metallic rim reflection)
  const carWheel = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Tinted windows
  const carWindow = new THREE.MeshStandardMaterial({
    color: 0x202020,
    metalness: 0.0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
    envMapIntensity: 0.3
  });
  
  // Start/finish line (bright white, emissive)
  const startLine = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x444444,
    roughness: 0.3,
    metalness: 0.0
  });
  
  // Concrete wall material (white paint finish)
  const wall = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.6,
    metalness: 0.0
  });
  
  // Rumble strips (red/white alternating)
  const rumble = new THREE.MeshStandardMaterial({
    map: rumbleTexture,
    roughness: 0.7,
    metalness: 0.0
  });
  
  // Chain-link fence
  const fence = new THREE.MeshBasicMaterial({
    color: 0x888888,
    alphaMap: fenceAlphaTexture,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide
  });
  
  return {
    asphalt,
    grass,
    carBody,
    carWheel,
    carWindow,
    startLine,
    wall,
    rumble,
    fence
  };
}

export function disposeMaterials(materials: GameMaterials): void {
  Object.values(materials).forEach(material => {
    if (material) {
      material.dispose();
    }
  });
}