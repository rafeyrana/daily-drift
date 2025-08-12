import * as THREE from 'three';
import { clamp } from '../util/MathUtil';

export interface CameraTarget {
  position: THREE.Vector3;
  heading: number;
  speed: number;
  steerInput: number;
  driftAngle: number;
}

export class ChaseCamera {
  private camera: THREE.PerspectiveCamera;
  private currentPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private currentBank = 0;

  // Camera parameters
  private readonly baseDistance: number;
  private readonly baseHeight: number;
  private readonly naturalFrequency = 5.0; // Hz
  private readonly dampingRatio = 1.0; // Critical damping
  private readonly maxBank = (Math.PI / 180) * 8; // 8 degrees
  private readonly lookAheadDistance = 3.0; // meters

  // Spring-damper system state
  private positionVelocity = new THREE.Vector3();
  private lookAtVelocity = new THREE.Vector3();
  private bankVelocity = 0;

  constructor(camera: THREE.PerspectiveCamera, distance = 8, height = 4) {
    this.camera = camera;
    this.baseDistance = distance;
    this.baseHeight = height;
  }

  update(deltaTime: number, target: CameraTarget): void {
    // FIXED FOLLOW CAMERA: rigidly mount behind the car without smoothing/banking
    const pos = this.calculateTargetPosition(target);
    const lookAt = new THREE.Vector3(target.position.x, target.position.y + 1.0, target.position.z);
    this.camera.position.copy(pos);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(lookAt);
    this.camera.updateMatrix();
  }

  private calculateTargetPosition(target: CameraTarget): THREE.Vector3 {
    const behindOffset = -this.baseDistance;
    const heightOffset = this.baseHeight;

    // Calculate position behind the car
    const cosHeading = Math.cos(target.heading);
    const sinHeading = Math.sin(target.heading);

    const targetX = target.position.x + behindOffset * cosHeading;
    const targetZ = target.position.z + behindOffset * sinHeading;
    const targetY = target.position.y + heightOffset;

    return new THREE.Vector3(targetX, targetY, targetZ);
  }

  private calculateTargetLookAt(target: CameraTarget): THREE.Vector3 {
    // Look ahead of the car based on speed
    const lookAheadFactor = Math.min(target.speed / 20, 1.0); // Normalize to 20 m/s max
    const actualLookAhead = this.lookAheadDistance * lookAheadFactor;

    const cosHeading = Math.cos(target.heading);
    const sinHeading = Math.sin(target.heading);

    const lookAtX = target.position.x + actualLookAhead * cosHeading;
    const lookAtZ = target.position.z + actualLookAhead * sinHeading;
    const lookAtY = target.position.y + 1.0; // Look slightly above car center

    return new THREE.Vector3(lookAtX, lookAtY, lookAtZ);
  }

  private calculateTargetBank(target: CameraTarget): number {
    // Bank based on steering input and drift angle
    const steerBank = target.steerInput * 0.5;
    const driftBank = target.driftAngle * 0.3;

    const totalBank = steerBank + driftBank;
    return clamp(totalBank, -this.maxBank, this.maxBank);
  }

  private updateSpringDamper(
    current: THREE.Vector3,
    velocity: THREE.Vector3,
    target: THREE.Vector3,
    deltaTime: number
  ): void {
    const omega = 2 * Math.PI * this.naturalFrequency;
    const zeta = this.dampingRatio;

    // Calculate displacement
    const displacement = new THREE.Vector3().subVectors(target, current);

    // Spring-damper forces
    const springForce = displacement.multiplyScalar(omega * omega);
    const damperForce = velocity.clone().multiplyScalar(-2 * zeta * omega);

    // Total acceleration
    const acceleration = springForce.add(damperForce);

    // Update velocity and position
    velocity.addScaledVector(acceleration, deltaTime);
    current.addScaledVector(velocity, deltaTime);
  }

  private updateSpringDamperScalar(
    current: number,
    velocity: number,
    target: number,
    deltaTime: number
  ): number {
    const omega = 2 * Math.PI * this.naturalFrequency;
    const zeta = this.dampingRatio;

    const displacement = target - current;
    const springForce = displacement * omega * omega;
    const damperForce = -velocity * 2 * zeta * omega;

    const acceleration = springForce + damperForce;

    this.bankVelocity += acceleration * deltaTime;
    return current + this.bankVelocity * deltaTime;
  }

  private applyCameraTransform(): void {
    // Set camera position
    this.camera.position.copy(this.currentPosition);

    // Create look-at direction
    const direction = new THREE.Vector3().subVectors(this.currentLookAt, this.currentPosition);
    direction.normalize();

    // Calculate camera orientation with banking
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    const actualUp = new THREE.Vector3().crossVectors(right, direction);

    // Apply bank rotation
    const bankRotation = new THREE.Matrix4().makeRotationAxis(direction, this.currentBank);
    actualUp.applyMatrix4(bankRotation);

    // Set camera orientation (set up before lookAt to ensure bank is respected)
    this.camera.up.copy(actualUp);
    this.camera.lookAt(this.currentLookAt);
    this.camera.updateMatrix();
  }

  reset(position: THREE.Vector3, heading: number): void {
    // Reset spring-damper state
    const targetPosition = new THREE.Vector3(
      position.x - this.baseDistance * Math.cos(heading),
      position.y + this.baseHeight,
      position.z - this.baseDistance * Math.sin(heading)
    );

    const targetLookAt = position.clone();
    targetLookAt.y += 1.0;

    this.currentPosition.copy(targetPosition);
    this.currentLookAt.copy(targetLookAt);
    this.currentBank = 0;

    this.positionVelocity.set(0, 0, 0);
    this.lookAtVelocity.set(0, 0, 0);
    this.bankVelocity = 0;

    // Apply initial transform
    this.applyCameraTransform();
  }
}
