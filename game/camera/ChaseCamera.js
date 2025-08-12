import * as THREE from 'three';
import { clamp } from '../util/MathUtil';
export class ChaseCamera {
    camera;
    currentPosition = new THREE.Vector3();
    currentLookAt = new THREE.Vector3();
    currentBank = 0;
    // Camera parameters
    baseDistance;
    baseHeight;
    naturalFrequency = 5.0; // Hz
    dampingRatio = 1.0; // Critical damping
    maxBank = Math.PI / 180 * 8; // 8 degrees
    lookAheadDistance = 3.0; // meters
    // Spring-damper system state
    positionVelocity = new THREE.Vector3();
    lookAtVelocity = new THREE.Vector3();
    bankVelocity = 0;
    constructor(camera, distance = 8, height = 4) {
        this.camera = camera;
        this.baseDistance = distance;
        this.baseHeight = height;
    }
    update(deltaTime, target) {
        // Calculate target camera position
        const targetPosition = this.calculateTargetPosition(target);
        // Calculate target look-at position
        const targetLookAt = this.calculateTargetLookAt(target);
        // Calculate target bank angle
        const targetBank = this.calculateTargetBank(target);
        // Apply spring-damped smoothing
        this.updateSpringDamper(this.currentPosition, this.positionVelocity, targetPosition, deltaTime);
        this.updateSpringDamper(this.currentLookAt, this.lookAtVelocity, targetLookAt, deltaTime);
        this.currentBank = this.updateSpringDamperScalar(this.currentBank, this.bankVelocity, targetBank, deltaTime);
        // Apply camera transform
        this.applyCameraTransform();
    }
    calculateTargetPosition(target) {
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
    calculateTargetLookAt(target) {
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
    calculateTargetBank(target) {
        // Bank based on steering input and drift angle
        const steerBank = target.steerInput * 0.5;
        const driftBank = target.driftAngle * 0.3;
        const totalBank = steerBank + driftBank;
        return clamp(totalBank, -this.maxBank, this.maxBank);
    }
    updateSpringDamper(current, velocity, target, deltaTime) {
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
    updateSpringDamperScalar(current, velocity, target, deltaTime) {
        const omega = 2 * Math.PI * this.naturalFrequency;
        const zeta = this.dampingRatio;
        const displacement = target - current;
        const springForce = displacement * omega * omega;
        const damperForce = -velocity * 2 * zeta * omega;
        const acceleration = springForce + damperForce;
        this.bankVelocity += acceleration * deltaTime;
        return current + this.bankVelocity * deltaTime;
    }
    applyCameraTransform() {
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
        // Set camera orientation
        this.camera.lookAt(this.currentLookAt);
        this.camera.up.copy(actualUp);
        this.camera.updateMatrix();
    }
    reset(position, heading) {
        // Reset spring-damper state
        const targetPosition = new THREE.Vector3(position.x - this.baseDistance * Math.cos(heading), position.y + this.baseHeight, position.z - this.baseDistance * Math.sin(heading));
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
//# sourceMappingURL=ChaseCamera.js.map