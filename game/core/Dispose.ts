import * as THREE from 'three';

export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => disposeMaterial(material));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
  
  if (obj.parent) {
    obj.parent.remove(obj);
  }
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose();
  
  // Dispose textures
  Object.values(material).forEach(value => {
    if (value && typeof value === 'object' && 'dispose' in value) {
      (value as any).dispose();
    }
  });
}

export function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.dispose();
  renderer.forceContextLoss();
}

export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => disposeMaterial(material));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
  
  scene.clear();
}