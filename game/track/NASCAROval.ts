import * as THREE from 'three';
import { GameOptions } from '../index';
import { CenterlineSample } from './TrackUtil';
import { GameMaterials } from '../materials/Materials';

export interface NASCARTrackMeshes {
  trackMesh: THREE.Mesh;
  startLineMesh: THREE.Mesh;
  wallsGroup: THREE.Group | null;
  rumbleGroup: THREE.Group | null;
  fenceGroup: THREE.Group | null;
  paintedLinesGroup: THREE.Group;
  infieldMesh: THREE.Mesh;
  centerlineSamples: CenterlineSample[];
}

export function createNASCAROval(
  options: GameOptions,
  materials: GameMaterials
): NASCARTrackMeshes {
  // Generate NASCAR-style oval centerline
  const centerlineSamples = generateNASCAROvalCenterline(options);
  
  // Create banked track surface
  const trackMesh = createBankedTrackSurface(centerlineSamples, options, materials.asphalt);
  
  // Create painted lines
  const paintedLinesGroup = createPaintedLines(centerlineSamples, options, materials.startLine);
  
  // Create start/finish line
  const startLineMesh = createStartFinishLine(centerlineSamples[0], options, materials.startLine);
  
  // Create infield
  const infieldMesh = createInfield(centerlineSamples, options, materials.grass);
  
  // Create walls, rumble strips, and fence if enabled
  const wallsGroup = options.enableWalls ? createOuterWalls(centerlineSamples, options, materials.wall) : null;
  const rumbleGroup = createRumbleStrips(centerlineSamples, options, materials.rumble);
  const fenceGroup = options.enableWalls ? createSafetyFence(centerlineSamples, options, materials.fence) : null;
  
  return {
    trackMesh,
    startLineMesh,
    wallsGroup,
    rumbleGroup,
    fenceGroup,
    paintedLinesGroup,
    infieldMesh,
    centerlineSamples
  };
}

function generateNASCAROvalCenterline(options: GameOptions): CenterlineSample[] {
  const samples: CenterlineSample[] = [];
  const numSamples = options.samples;
  
  const straightLength = options.straightLength;
  const cornerRadiusInner = options.cornerRadiusInner;
  const cornerRadiusOuter = options.cornerRadiusOuter;
  
  // Calculate total track length for parameterization
  const straightSegmentLength = straightLength;
  const cornerArcLength = Math.PI * (cornerRadiusInner + cornerRadiusOuter) / 2;
  const totalLength = 2 * straightSegmentLength + 2 * cornerArcLength;
  
  let arcLength = 0;
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const distanceAlongTrack = t * totalLength;
    
    let position: THREE.Vector3;
    let tangent: THREE.Vector3;
    let bankAngle: number;
    
    if (distanceAlongTrack < straightSegmentLength) {
      // Front straight
      const progress = distanceAlongTrack / straightSegmentLength;
      position = new THREE.Vector3(
        -straightLength / 2 + progress * straightLength,
        0,
        0
      );
      tangent = new THREE.Vector3(1, 0, 0);
      bankAngle = options.bankAngleStraights * Math.PI / 180;
      
    } else if (distanceAlongTrack < straightSegmentLength + cornerArcLength) {
      // Turn 1 (right turn at end of front straight)
      const progress = (distanceAlongTrack - straightSegmentLength) / cornerArcLength;
      const angle = progress * Math.PI; // 180 degrees
      const radius = cornerRadiusOuter;
      
      position = new THREE.Vector3(
        straightLength / 2 + radius * Math.sin(angle),
        0,
        radius * (1 - Math.cos(angle))
      );
      tangent = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      bankAngle = options.bankAngleCorners * Math.PI / 180;
      
    } else if (distanceAlongTrack < 2 * straightSegmentLength + cornerArcLength) {
      // Back straight
      const progress = (distanceAlongTrack - straightSegmentLength - cornerArcLength) / straightSegmentLength;
      position = new THREE.Vector3(
        straightLength / 2 - progress * straightLength,
        0,
        2 * cornerRadiusOuter
      );
      tangent = new THREE.Vector3(-1, 0, 0);
      bankAngle = options.bankAngleStraights * Math.PI / 180;
      
    } else {
      // Turn 2 (left turn at end of back straight)
      const progress = (distanceAlongTrack - 2 * straightSegmentLength - cornerArcLength) / cornerArcLength;
      const angle = progress * Math.PI + Math.PI; // 180 to 360 degrees
      const radius = cornerRadiusOuter;
      
      position = new THREE.Vector3(
        -straightLength / 2 + radius * Math.sin(angle),
        0,
        radius * (1 - Math.cos(angle))
      );
      tangent = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      bankAngle = options.bankAngleCorners * Math.PI / 180;
    }
    
    // Calculate normal (pointing right when looking along tangent)
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    
    // Apply banking by tilting the normal
    const bankingAxis = tangent.clone();
    const bankedNormal = normal.clone().applyAxisAngle(bankingAxis, -bankAngle);
    
    samples.push({
      position,
      tangent: tangent.normalize(),
      normal: bankedNormal.normalize(),
      arcLength
    });
    
    // Update arc length for next iteration
    if (i > 0) {
      arcLength += position.distanceTo(samples[i - 1].position);
      samples[i].arcLength = arcLength;
    }
  }
  
  return samples;
}

function createBankedTrackSurface(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Mesh {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  
  const halfWidth = options.trackWidth / 2;
  const numSamples = centerlineSamples.length;
  
  // Generate vertices for inner and outer edges with banking
  for (let i = 0; i < numSamples; i++) {
    const sample = centerlineSamples[i];
    const nextSample = centerlineSamples[(i + 1) % numSamples];
    
    // Calculate UV coordinates
    const u = sample.arcLength / centerlineSamples[numSamples - 1].arcLength;
    
    // Inner edge vertex (left side)
    const innerPos = sample.position.clone().addScaledVector(sample.normal, -halfWidth);
    vertices.push(innerPos.x, innerPos.y, innerPos.z);
    uvs.push(u * options.asphaltRepeatU, 0);
    
    // Outer edge vertex (right side)  
    const outerPos = sample.position.clone().addScaledVector(sample.normal, halfWidth);
    vertices.push(outerPos.x, outerPos.y, outerPos.z);
    uvs.push(u * options.asphaltRepeatU, 1);
    
    // Calculate surface normals accounting for banking
    const surfaceUp = new THREE.Vector3(0, 1, 0);
    const bankedUp = surfaceUp.clone().applyAxisAngle(sample.tangent, Math.atan2(sample.normal.y, sample.normal.z));
    
    normals.push(bankedUp.x, bankedUp.y, bankedUp.z);
    normals.push(bankedUp.x, bankedUp.y, bankedUp.z);
  }
  
  // Generate triangle indices for track surface
  for (let i = 0; i < numSamples; i++) {
    const nextI = (i + 1) % numSamples;
    
    const i0 = i * 2;         // Inner current
    const i1 = i * 2 + 1;     // Outer current
    const i2 = nextI * 2;     // Inner next
    const i3 = nextI * 2 + 1; // Outer next
    
    // First triangle (inner-outer-inner_next)
    indices.push(i0, i1, i2);
    // Second triangle (outer-outer_next-inner_next)
    indices.push(i1, i3, i2);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  
  return mesh;
}

function createPaintedLines(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Group {
  const linesGroup = new THREE.Group();
  const lineWidth = 0.15;
  const lineHeight = 0.002; // Slightly above track surface
  
  // Create double yellow line (inside apron)
  const innerLineOffset = -options.trackWidth / 2 + 1.0; // 1m from inner edge
  const innerLine = createLineStrip(centerlineSamples, innerLineOffset, lineWidth, lineHeight, material, 0xffff00);
  linesGroup.add(innerLine);
  
  // Create white outer line
  const outerLineOffset = options.trackWidth / 2 - 0.6; // 0.6m from outer edge
  const outerLine = createLineStrip(centerlineSamples, outerLineOffset, lineWidth, lineHeight, material, 0xffffff);
  linesGroup.add(outerLine);
  
  return linesGroup;
}

function createLineStrip(
  centerlineSamples: CenterlineSample[],
  offset: number,
  width: number,
  height: number,
  baseMaterial: THREE.Material,
  color: number
): THREE.Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  
  // Create line vertices
  for (let i = 0; i < centerlineSamples.length; i++) {
    const sample = centerlineSamples[i];
    
    const centerPos = sample.position.clone().addScaledVector(sample.normal, offset);
    const tangent = sample.tangent;
    const lineRight = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    
    // Left edge of line
    const leftPos = centerPos.clone().addScaledVector(lineRight, -width / 2);
    leftPos.y += height;
    vertices.push(leftPos.x, leftPos.y, leftPos.z);
    
    // Right edge of line  
    const rightPos = centerPos.clone().addScaledVector(lineRight, width / 2);
    rightPos.y += height;
    vertices.push(rightPos.x, rightPos.y, rightPos.z);
    
    // UV coordinates
    const u = i / centerlineSamples.length;
    uvs.push(u, 0);
    uvs.push(u, 1);
  }
  
  // Generate indices for line strip
  for (let i = 0; i < centerlineSamples.length - 1; i++) {
    const base = i * 2;
    
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  
  const lineMaterial = baseMaterial.clone();
  (lineMaterial as any).color = new THREE.Color(color);
  
  return new THREE.Mesh(geometry, lineMaterial);
}

function createStartFinishLine(
  startSample: CenterlineSample,
  options: GameOptions,
  material: THREE.Material
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(options.trackWidth, 1.0);
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position at start point
  mesh.position.copy(startSample.position);
  mesh.position.y += 0.003; // Slightly above track
  
  // Orient perpendicular to track direction
  mesh.lookAt(startSample.position.clone().add(startSample.normal));
  mesh.rotateX(-Math.PI / 2);
  
  return mesh;
}

function createInfield(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Mesh {
  // Create a large circular grass area for the infield
  const infieldRadius = Math.min(options.cornerRadiusInner - 5, 30);
  const geometry = new THREE.CircleGeometry(infieldRadius, 32);
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.01; // Slightly below track level
  mesh.receiveShadow = true;
  
  return mesh;
}

function createOuterWalls(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Group {
  const wallsGroup = new THREE.Group();
  const wallHeight = 1.2;
  const wallThickness = 0.2;
  const wallOffset = options.trackWidth / 2 + wallThickness / 2;
  
  // Create wall segments (merge for performance)
  const wallGeometries: THREE.BoxGeometry[] = [];
  const wallPositions: THREE.Vector3[] = [];
  const wallRotations: THREE.Euler[] = [];
  
  for (let i = 0; i < centerlineSamples.length; i += 8) { // Every 8th sample
    const sample = centerlineSamples[i];
    const wallPos = sample.position.clone().addScaledVector(sample.normal, wallOffset);
    wallPos.y = wallHeight / 2;
    
    const wallGeometry = new THREE.BoxGeometry(2, wallHeight, wallThickness);
    const rotation = new THREE.Euler(0, Math.atan2(sample.tangent.z, sample.tangent.x), 0);
    
    wallGeometries.push(wallGeometry);
    wallPositions.push(wallPos);
    wallRotations.push(rotation);
  }
  
  // Create merged wall geometry
  const mergedGeometry = new THREE.BufferGeometry();
  const geometries: THREE.BufferGeometry[] = [];
  
  wallGeometries.forEach((geometry, index) => {
    const matrix = new THREE.Matrix4();
    matrix.makeRotationFromEuler(wallRotations[index]);
    matrix.setPosition(wallPositions[index]);
    
    geometry.applyMatrix4(matrix);
    geometries.push(geometry);
  });
  
  mergedGeometry.copy(geometries[0]);
  for (let i = 1; i < geometries.length; i++) {
    mergedGeometry.merge(geometries[i]);
  }
  
  const wallMesh = new THREE.Mesh(mergedGeometry, material);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  
  wallsGroup.add(wallMesh);
  return wallsGroup;
}

function createRumbleStrips(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Group {
  const rumbleGroup = new THREE.Group();
  const rumbleWidth = 0.4;
  const rumbleHeight = 0.05;
  
  // Create rumble strips at track edges (dashed)
  for (let i = 0; i < centerlineSamples.length; i += 20) { // Dashed pattern
    if (i + 10 >= centerlineSamples.length) continue;
    
    const startSample = centerlineSamples[i];
    const endSample = centerlineSamples[i + 10];
    
    // Inner rumble
    const innerRumble = createRumbleSegment(startSample, endSample, -options.trackWidth / 2 + rumbleWidth / 2, rumbleWidth, rumbleHeight, material);
    rumbleGroup.add(innerRumble);
    
    // Outer rumble  
    const outerRumble = createRumbleSegment(startSample, endSample, options.trackWidth / 2 - rumbleWidth / 2, rumbleWidth, rumbleHeight, material);
    rumbleGroup.add(outerRumble);
  }
  
  return rumbleGroup;
}

function createRumbleSegment(
  startSample: CenterlineSample,
  endSample: CenterlineSample,
  offset: number,
  width: number,
  height: number,
  material: THREE.Material
): THREE.Mesh {
  const length = startSample.position.distanceTo(endSample.position);
  const geometry = new THREE.BoxGeometry(length, height, width);
  
  const centerPos = startSample.position.clone().lerp(endSample.position, 0.5);
  centerPos.addScaledVector(startSample.normal, offset);
  centerPos.y += height / 2;
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(centerPos);
  
  const direction = endSample.position.clone().sub(startSample.position).normalize();
  mesh.lookAt(centerPos.clone().add(direction));
  
  return mesh;
}

function createSafetyFence(
  centerlineSamples: CenterlineSample[],
  options: GameOptions,
  material: THREE.Material
): THREE.Group {
  const fenceGroup = new THREE.Group();
  const fenceHeight = 3.0;
  const fenceOffset = options.trackWidth / 2 + 1.5; // Behind the wall
  
  // Create fence posts (instanced)
  const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, fenceHeight, 8);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const postMesh = new THREE.InstancedMesh(postGeometry, postMaterial, Math.floor(centerlineSamples.length / 10));
  
  let postIndex = 0;
  for (let i = 0; i < centerlineSamples.length; i += 10) {
    if (postIndex >= postMesh.count) break;
    
    const sample = centerlineSamples[i];
    const postPos = sample.position.clone().addScaledVector(sample.normal, fenceOffset);
    postPos.y = fenceHeight / 2;
    
    const matrix = new THREE.Matrix4();
    matrix.setPosition(postPos);
    postMesh.setMatrixAt(postIndex++, matrix);
  }
  
  postMesh.instanceMatrix.needsUpdate = true;
  fenceGroup.add(postMesh);
  
  // Create fence mesh sections
  const fenceGeometry = new THREE.PlaneGeometry(8, fenceHeight);
  for (let i = 0; i < centerlineSamples.length; i += 20) {
    const sample = centerlineSamples[i];
    const fencePos = sample.position.clone().addScaledVector(sample.normal, fenceOffset);
    fencePos.y = fenceHeight / 2;
    
    const fenceMesh = new THREE.Mesh(fenceGeometry, material);
    fenceMesh.position.copy(fencePos);
    fenceMesh.lookAt(fencePos.clone().add(sample.tangent));
    
    fenceGroup.add(fenceMesh);
  }
  
  return fenceGroup;
}