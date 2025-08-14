import * as THREE from 'three';
import { GameMaterials } from '../materials/Materials';

export class Car {
  public object3d: THREE.Group;
  private body: THREE.Mesh;
  private wheels: THREE.Mesh[] = [];
  private frontWheels: THREE.Mesh[] = [];

  // Car dimensions
  private readonly carLength = 4.0;
  private readonly carWidth = 1.8;
  private readonly carHeight = 1.2;
  private readonly wheelRadius = 0.3;
  private readonly wheelWidth = 0.2;
  private readonly wheelBase = 2.6;

  constructor(materials: GameMaterials) {
    this.object3d = new THREE.Group();
    this.createCarBody(materials);
    this.createWheels(materials);
  }

  private createCarBody(materials: GameMaterials): void {
    // NASCAR stock car body - elongated capsule-like hull
    this.createStockCarShell(materials);
    this.createWindows(materials);
    this.createSpoiler(materials);
  }

  private createStockCarShell(materials: GameMaterials): void {
    const bodyGroup = new THREE.Group();

    // Main body (hood section)
    const hoodGeometry = new THREE.BoxGeometry(
      this.carLength * 0.4,
      this.carHeight * 0.6,
      this.carWidth
    );
    const hood = new THREE.Mesh(hoodGeometry, materials.carBody);
    hood.position.set(this.carLength * 0.2, this.carHeight * 0.4, 0);
    bodyGroup.add(hood);

    // Cabin section (higher and narrower)
    const cabinGeometry = new THREE.BoxGeometry(
      this.carLength * 0.35,
      this.carHeight * 0.9,
      this.carWidth * 0.9
    );
    const cabin = new THREE.Mesh(cabinGeometry, materials.carBody);
    cabin.position.set(-0.1, this.carHeight * 0.55, 0);
    bodyGroup.add(cabin);

    // Trunk section
    const trunkGeometry = new THREE.BoxGeometry(
      this.carLength * 0.25,
      this.carHeight * 0.5,
      this.carWidth * 0.95
    );
    const trunk = new THREE.Mesh(trunkGeometry, materials.carBody);
    trunk.position.set(-this.carLength * 0.275, this.carHeight * 0.35, 0);
    bodyGroup.add(trunk);

    // Nose cone (aerodynamic front)
    const noseGeometry = new THREE.ConeGeometry(this.carWidth * 0.3, this.carLength * 0.15, 8);
    const nose = new THREE.Mesh(noseGeometry, materials.carBody);
    nose.position.set(this.carLength * 0.425, this.carHeight * 0.3, 0);
    nose.rotation.z = Math.PI / 2;
    bodyGroup.add(nose);

    // Enable shadows for all body parts
    bodyGroup.children.forEach((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });

    this.body = bodyGroup;
    this.object3d.add(bodyGroup);
  }

  private createWindows(materials: GameMaterials): void {
    // Front windshield
    const windshieldGeometry = new THREE.BoxGeometry(
      this.carLength * 0.25,
      this.carHeight * 0.6,
      this.carWidth * 0.88
    );
    const windshield = new THREE.Mesh(windshieldGeometry, materials.carWindow);
    windshield.position.set(0.3, this.carHeight * 0.7, 0);
    windshield.rotation.x = -0.1; // Slight rake
    this.object3d.add(windshield);

    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(
      this.carLength * 0.2,
      this.carHeight * 0.4,
      0.02
    );

    // Left side window
    const leftWindow = new THREE.Mesh(sideWindowGeometry, materials.carWindow);
    leftWindow.position.set(-0.1, this.carHeight * 0.65, -this.carWidth * 0.44);
    this.object3d.add(leftWindow);

    // Right side window
    const rightWindow = new THREE.Mesh(sideWindowGeometry, materials.carWindow);
    rightWindow.position.set(-0.1, this.carHeight * 0.65, this.carWidth * 0.44);
    this.object3d.add(rightWindow);

    // Rear window
    const rearWindowGeometry = new THREE.BoxGeometry(
      this.carLength * 0.15,
      this.carHeight * 0.4,
      this.carWidth * 0.85
    );
    const rearWindow = new THREE.Mesh(rearWindowGeometry, materials.carWindow);
    rearWindow.position.set(-0.6, this.carHeight * 0.65, 0);
    rearWindow.rotation.x = 0.1; // Slight reverse rake
    this.object3d.add(rearWindow);
  }

  private createSpoiler(materials: GameMaterials): void {
    // NASCAR-style rear spoiler
    const spoilerGeometry = new THREE.BoxGeometry(0.1, 0.3, this.carWidth * 0.9);
    const spoiler = new THREE.Mesh(spoilerGeometry, materials.carBody);
    spoiler.position.set(-this.carLength * 0.45, this.carHeight * 0.7, 0);
    spoiler.castShadow = true;
    this.object3d.add(spoiler);

    // Spoiler support brackets
    const bracketGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
    const leftBracket = new THREE.Mesh(bracketGeometry, materials.carBody);
    leftBracket.position.set(-this.carLength * 0.45, this.carHeight * 0.5, -this.carWidth * 0.3);
    this.object3d.add(leftBracket);

    const rightBracket = new THREE.Mesh(bracketGeometry, materials.carBody);
    rightBracket.position.set(-this.carLength * 0.45, this.carHeight * 0.5, this.carWidth * 0.3);
    this.object3d.add(rightBracket);
  }

  private createWheels(materials: GameMaterials): void {
    const wheelGeometry = new THREE.CylinderGeometry(
      this.wheelRadius,
      this.wheelRadius,
      this.wheelWidth,
      12
    );

    // Wheel positions relative to car center
    const wheelPositions = [
      { x: this.wheelBase / 2, z: -this.carWidth / 2 - this.wheelWidth / 2, front: true }, // Front left
      { x: this.wheelBase / 2, z: this.carWidth / 2 + this.wheelWidth / 2, front: true }, // Front right
      { x: -this.wheelBase / 2, z: -this.carWidth / 2 - this.wheelWidth / 2, front: false }, // Rear left
      { x: -this.wheelBase / 2, z: this.carWidth / 2 + this.wheelWidth / 2, front: false }, // Rear right
    ];

    wheelPositions.forEach((pos, index) => {
      const wheel = new THREE.Mesh(wheelGeometry, materials.carWheel);
      wheel.position.set(pos.x, this.wheelRadius, pos.z);
      wheel.rotation.z = Math.PI / 2; // Rotate to be vertical
      wheel.castShadow = true;

      this.wheels.push(wheel);
      if (pos.front) {
        this.frontWheels.push(wheel);
      }

      this.object3d.add(wheel);
    });
  }

  setPose(position: { x: number; z: number }, heading: number, roll: number = 0): void {
    this.object3d.position.set(position.x, 0, position.z);
    this.object3d.rotation.y = heading;
    this.object3d.rotation.z = roll;
  }

  updateWheelVisuals(steerAngle: number, speed: number, dt: number): void {
    // Update front wheel steering
    this.frontWheels.forEach((wheel) => {
      wheel.rotation.y = steerAngle;
    });

    // Update wheel spin based on speed
    const wheelRotation = speed / this.wheelRadius; // rad/s
    this.wheels.forEach((wheel) => {
      wheel.rotation.x += wheelRotation * dt;
    });
  }

  getPosition(): THREE.Vector3 {
    return this.object3d.position.clone();
  }

  getHeading(): number {
    return this.object3d.rotation.y;
  }

  // Get center of mass position (slightly forward of geometric center)
  getCenterOfMass(): THREE.Vector3 {
    const comOffset = new THREE.Vector3(0.2, 0, 0); // 20cm forward
    const worldCom = comOffset.clone();
    worldCom.applyMatrix4(this.object3d.matrixWorld);
    return worldCom;
  }
}
