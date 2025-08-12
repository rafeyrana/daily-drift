import * as THREE from 'three';
import { createEllipseCenterline, CenterlineSample } from './TrackUtil';

export interface TrackMeshes {
  trackMesh: THREE.Mesh;
  startLineMesh: THREE.Mesh;
  wallsGroup: THREE.Group | null;
  centerlineSamples: CenterlineSample[];
}

export function createOvalTrack(
  majorRadius: number,
  minorRadius: number,
  width: number,
  samples: number,
  enableWalls = true
): TrackMeshes {
  const centerlineSamples = createEllipseCenterline(majorRadius, minorRadius, samples);
  
  // Create track ribbon mesh
  const trackMesh = createTrackRibbon(centerlineSamples, width);
  
  // Create start line
  const startLineMesh = createStartLine(centerlineSamples[0], width);
  
  // Create walls if enabled
  const wallsGroup = enableWalls ? createTrackWalls(centerlineSamples, width) : null;
  
  return {
    trackMesh,
    startLineMesh,
    wallsGroup,
    centerlineSamples
  };
}

function createTrackRibbon(centerlineSamples: CenterlineSample[], width: number): THREE.Mesh {
  const halfWidth = width / 2;
  const numSamples = centerlineSamples.length;
  
  // Create vertices for inner and outer edges
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  let totalDistance = 0;
  
  for (let i = 0; i < numSamples; i++) {
    const sample = centerlineSamples[i];
    
    // Calculate UV coordinates based on arc length
    const u = sample.arcLength / centerlineSamples[numSamples - 1].arcLength;
    
    // Inner edge (left side)
    const innerPos = sample.position.clone().addScaledVector(sample.normal, -halfWidth);
    vertices.push(innerPos.x, innerPos.y, innerPos.z);
    uvs.push(u * 10, 0); // Scale U for tiling
    
    // Outer edge (right side)
    const outerPos = sample.position.clone().addScaledVector(sample.normal, halfWidth);
    vertices.push(outerPos.x, outerPos.y, outerPos.z);
    uvs.push(u * 10, 1);
  }
  
  // Create triangle indices
  for (let i = 0; i < numSamples; i++) {
    const nextI = (i + 1) % numSamples;
    
    const i0 = i * 2;     // Inner current
    const i1 = i * 2 + 1; // Outer current
    const i2 = nextI * 2; // Inner next
    const i3 = nextI * 2 + 1; // Outer next
    
    // First triangle
    indices.push(i0, i2, i1);
    // Second triangle
    indices.push(i1, i2, i3);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  // Create asphalt material
  const material = new THREE.MeshLambertMaterial({
    color: 0x444444,
    side: THREE.DoubleSide
  });
  
  return new THREE.Mesh(geometry, material);
}

function createStartLine(firstSample: CenterlineSample, trackWidth: number): THREE.Mesh {
  const halfWidth = trackWidth / 2;
  
  const geometry = new THREE.PlaneGeometry(trackWidth, 0.5);
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position at start point
  mesh.position.copy(firstSample.position);
  mesh.position.y += 0.01; // Slightly above track
  
  // Orient perpendicular to track direction
  const up = new THREE.Vector3(0, 1, 0);
  mesh.lookAt(firstSample.position.clone().add(firstSample.normal));
  mesh.rotateX(-Math.PI / 2);
  
  return mesh;
}

function createTrackWalls(centerlineSamples: CenterlineSample[], trackWidth: number): THREE.Group {
  const wallsGroup = new THREE.Group();
  const halfWidth = trackWidth / 2;
  const wallHeight = 0.5;
  const wallThickness = 0.2;
  const spacing = 5; // Place wall segments every 5 samples
  
  const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2);
  const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
  
  for (let i = 0; i < centerlineSamples.length; i += spacing) {
    const sample = centerlineSamples[i];
    
    // Inner wall
    const innerWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const innerPos = sample.position.clone().addScaledVector(sample.normal, -(halfWidth + wallThickness/2));
    innerWall.position.copy(innerPos);
    innerWall.position.y = wallHeight / 2;
    innerWall.lookAt(innerPos.clone().add(sample.tangent));
    wallsGroup.add(innerWall);
    
    // Outer wall
    const outerWall = new THREE.Mesh(wallGeometry, wallMaterial);
    const outerPos = sample.position.clone().addScaledVector(sample.normal, halfWidth + wallThickness/2);
    outerWall.position.copy(outerPos);
    outerWall.position.y = wallHeight / 2;
    outerWall.lookAt(outerPos.clone().add(sample.tangent));
    wallsGroup.add(outerWall);
  }
  
  return wallsGroup;
}