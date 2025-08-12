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
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(this.carLength, this.carHeight, this.carWidth);
    this.body = new THREE.Mesh(bodyGeometry, materials.carBody);
    this.body.position.y = this.carHeight / 2;
    this.body.castShadow = true;
    this.body.receiveShadow = true;

    this.object3d.add(this.body);

    // Windshield (slightly transparent)
    const windshieldGeometry = new THREE.BoxGeometry(
      this.carLength * 0.6,
      this.carHeight * 0.4,
      this.carWidth * 0.8
    );
    const windshieldMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3,
      shininess: 100,
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.y = this.carHeight * 0.8;
    windshield.position.x = -0.2; // Slightly towards rear
    this.object3d.add(windshield);
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
