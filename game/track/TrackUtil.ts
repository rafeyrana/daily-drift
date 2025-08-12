import * as THREE from 'three';

export interface CenterlineSample {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  arcLength: number;
}

export interface NearestPoint {
  sampleIndex: number;
  lateralDistance: number; // Negative = left of centerline, Positive = right
  distanceAlongTrack: number;
}

export function findNearestOnCenterline(
  position: THREE.Vector3, 
  centerlineSamples: CenterlineSample[]
): NearestPoint {
  let minDistance = Infinity;
  let nearestIndex = 0;
  
  for (let i = 0; i < centerlineSamples.length; i++) {
    const sample = centerlineSamples[i];
    const distance = position.distanceTo(sample.position);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }
  
  const nearestSample = centerlineSamples[nearestIndex];
  
  // Calculate lateral distance (signed)
  const toPosition = new THREE.Vector3().subVectors(position, nearestSample.position);
  const lateralDistance = toPosition.dot(nearestSample.normal);
  
  return {
    sampleIndex: nearestIndex,
    lateralDistance,
    distanceAlongTrack: nearestSample.arcLength
  };
}

export function isOffTrack(lateralDistance: number, trackWidth: number, tolerance = 0.4): boolean {
  return Math.abs(lateralDistance) > (trackWidth / 2 + tolerance);
}

export function createEllipseCenterline(
  majorRadius: number, 
  minorRadius: number, 
  samples: number
): CenterlineSample[] {
  const centerline: CenterlineSample[] = [];
  let totalArcLength = 0;
  
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * 2 * Math.PI;
    
    // Ellipse position
    const x = majorRadius * Math.cos(t);
    const z = minorRadius * Math.sin(t);
    const position = new THREE.Vector3(x, 0, z);
    
    // Calculate tangent (derivative of ellipse)
    const dx = -majorRadius * Math.sin(t);
    const dz = minorRadius * Math.cos(t);
    const tangent = new THREE.Vector3(dx, 0, dz).normalize();
    
    // Normal is perpendicular to tangent (pointing right when looking along tangent)
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x);
    
    // Calculate arc length for this segment
    if (i > 0) {
      const prevPosition = centerline[i - 1].position;
      totalArcLength += position.distanceTo(prevPosition);
    }
    
    centerline.push({
      position,
      tangent,
      normal,
      arcLength: totalArcLength
    });
  }
  
  return centerline;
}