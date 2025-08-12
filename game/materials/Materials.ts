import * as THREE from 'three';

export interface GameMaterials {
  asphalt: THREE.Material;
  grass: THREE.Material;
  carBody: THREE.Material;
  carWheel: THREE.Material;
  startLine: THREE.Material;
  wall: THREE.Material;
}

export function createMaterials(): GameMaterials {
  // Asphalt material for track surface
  const asphalt = new THREE.MeshLambertMaterial({
    color: 0x444444,
    side: THREE.DoubleSide
  });
  
  // Grass material for ground
  const grass = new THREE.MeshLambertMaterial({
    color: 0x4a7c59
  });
  
  // Car body material (bright color)
  const carBody = new THREE.MeshPhongMaterial({
    color: 0xff4444,
    shininess: 30,
    specular: 0x111111
  });
  
  // Car wheel material (dark)
  const carWheel = new THREE.MeshLambertMaterial({
    color: 0x222222
  });
  
  // Start line material (white)
  const startLine = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  
  // Wall material (concrete gray)
  const wall = new THREE.MeshLambertMaterial({
    color: 0x888888
  });
  
  return {
    asphalt,
    grass,
    carBody,
    carWheel,
    startLine,
    wall
  };
}

export function disposeMaterials(materials: GameMaterials): void {
  Object.values(materials).forEach(material => {
    if (material) {
      material.dispose();
    }
  });
}