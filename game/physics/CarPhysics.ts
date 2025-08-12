import { InputState } from '../core/Input';
import { clamp, wrapAngle } from '../util/MathUtil';
import { DriftEffects } from './DriftController';

export interface PhysicsParams {
  wheelBase: number;
  mass: number;
  cgToFront: number;
  cgToRear: number;
  maxSteer: number;
  engineForce: number;
  brakeForce: number;
  dragCoeff: number;
  frontalArea: number;
  airDensity: number;
  rollingResistance: number;
  baseFrontGrip: number;
  baseRearGrip: number;
  yawInertia: number;
  lateralDamping: number;
}

export interface CarKinematics {
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  heading: number;
  angularVelocity: number;
  speed: number;
  driftAngle: number;
  velocityHeading: number;
}

export class CarPhysics {
  private position = { x: 0, z: 0 };
  private velocity = { x: 0, z: 0 };
  private heading = 0;
  private angularVelocity = 0;
  private speed = 0;
  private driftAngle = 0;
  private velocityHeading = 0;

  constructor(private params: PhysicsParams) {}

  step(deltaTime: number, controls: InputState, driftEffects: DriftEffects): void {
    // Update speed first (for direction-independent calculations)
    this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    // Calculate velocity heading
    if (this.speed > 0.1) {
      this.velocityHeading = Math.atan2(this.velocity.z, this.velocity.x);
    } else {
      this.velocityHeading = this.heading;
    }

    // Calculate drift angle (slip angle)
    this.driftAngle = wrapAngle(this.velocityHeading - this.heading);

    // Apply longitudinal forces and resistive forces
    this.applyLongitudinalAndResistiveForces(deltaTime, controls);

    // Apply lateral dynamics with bicycle model
    this.applyLateralDynamics(deltaTime, controls, driftEffects);

    // Apply yaw torque from drift controller (torque semantics), scaled by speed so it does not spin at standstill
    if (Math.abs(driftEffects.yawTorque) > 0) {
      const torqueSpeedScale = Math.min(1, Math.max(0, (this.speed - 2) / 8)); // 0 below 2 m/s → 1 by ~10 m/s
      const scaledTorque = driftEffects.yawTorque * torqueSpeedScale;
      this.angularVelocity += (scaledTorque * deltaTime) / this.params.yawInertia;
    }

    // PD stabilization on drift angle and yaw rate
    const angleStiffness = this.params.lateralDamping; // reuse param as stiffness
    const dampingCoeff = this.params.lateralDamping * 0.5;
    const correctiveTorque =
      -angleStiffness * this.driftAngle - dampingCoeff * this.angularVelocity;
    this.angularVelocity += (correctiveTorque * deltaTime) / this.params.yawInertia;

    // Extra damping at low speeds to prevent endless spinning
    if (this.speed < 1.0) {
      this.angularVelocity *= 0.9; // exponential decay per step
      if (Math.abs(this.angularVelocity) < 1e-3) this.angularVelocity = 0;
    }

    // Update heading from angular velocity
    this.heading += this.angularVelocity * deltaTime;
    this.heading = wrapAngle(this.heading);

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Lateral velocity damping in vehicle frame to stabilize slides and prevent death spins
    this.applyLateralVelocityDamping(deltaTime);

    // Clamp maximum forward speed (vector magnitude)
    if (this.speed > 55) {
      const scale = 55 / this.speed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }
    // Cap reverse along heading (longitudinal component only)
    const longSpeed =
      this.velocity.x * Math.cos(this.heading) + this.velocity.z * Math.sin(this.heading);
    const maxReverse = -15;
    if (longSpeed < maxReverse) {
      const excess = maxReverse - longSpeed;
      this.velocity.x += excess * Math.cos(this.heading);
      this.velocity.z += excess * Math.sin(this.heading);
    }
  }

  private applyLateralVelocityDamping(dt: number): void {
    // Decompose world velocity into vehicle frame (longitudinal/lateral)
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);
    const long = this.velocity.x * cosH + this.velocity.z * sinH;
    const lat = -this.velocity.x * sinH + this.velocity.z * cosH;

    // Apply lateral damping proportional to speed (stronger at low speed to prevent spinning)
    const latDamp = clamp(4 - Math.abs(long) * 0.2, 1, 4); // between 1 and 4
    const newLat = lat * Math.exp(-latDamp * dt);

    // Recompose to world velocity
    this.velocity.x = long * cosH - newLat * sinH;
    this.velocity.z = long * sinH + newLat * cosH;
  }

  private applyLongitudinalAndResistiveForces(deltaTime: number, controls: InputState): void {
    const cosHeading = Math.cos(this.heading);
    const sinHeading = Math.sin(this.heading);

    // Engine/brake along heading
    let engineForce = 0;
    if (controls.throttle > 0) {
      engineForce = controls.throttle * this.params.engineForce;
    }

    let brakeForce = 0;
    if (controls.brake > 0) {
      if (this.speed < 1) {
        // Reverse uses engine force backward
        brakeForce = -controls.brake * this.params.engineForce * 0.5;
      } else {
        brakeForce = -controls.brake * this.params.brakeForce;
      }
    }
    const longAx = ((engineForce + brakeForce) / this.params.mass) * cosHeading;
    const longAz = ((engineForce + brakeForce) / this.params.mass) * sinHeading;

    // Resistive forces opposite velocity (drag ~ v|v|, rolling ~ v)
    const vx = this.velocity.x;
    const vz = this.velocity.z;
    const speed = Math.hypot(vx, vz);
    let ax = 0;
    let az = 0;
    if (speed > 1e-3) {
      const ux = vx / speed;
      const uz = vz / speed;
      const dragMag =
        0.5 *
        this.params.airDensity *
        this.params.frontalArea *
        this.params.dragCoeff *
        speed *
        speed;
      const rollMag = this.params.rollingResistance * speed; // proportional to speed
      ax += -(ux * (dragMag + rollMag)) / this.params.mass;
      az += -(uz * (dragMag + rollMag)) / this.params.mass;
    }

    this.velocity.x += (longAx + ax) * deltaTime;
    this.velocity.z += (longAz + az) * deltaTime;
  }

  private applyLateralDynamics(
    deltaTime: number,
    controls: InputState,
    driftEffects: DriftEffects
  ): void {
    if (this.speed < 0.1) return; // Skip lateral dynamics at very low speeds

    // Calculate steering angle
    const steerAngle = controls.steer * this.params.maxSteer;

    // Approximate slip angle using bicycle model simplification
    const beta = Math.atan(0.5 * Math.tan(steerAngle));

    // Calculate yaw rate from bicycle model
    const yawRate = (this.speed / this.params.wheelBase) * Math.sin(beta);

    // Calculate lateral forces at front and rear axles (scaled by speed to avoid static spin)
    const frontLateralForce = this.calculateLateralForce(
      beta,
      this.params.baseFrontGrip * driftEffects.frontGripMultiplier,
      this.params.cgToFront,
      this.speed
    );

    const rearLateralForce = this.calculateLateralForce(
      -this.driftAngle,
      this.params.baseRearGrip * driftEffects.rearGripMultiplier,
      this.params.cgToRear,
      this.speed
    );

    // Apply yaw moment
    const yawMoment =
      frontLateralForce * this.params.cgToFront - rearLateralForce * this.params.cgToRear;

    this.angularVelocity += (yawMoment / this.params.yawInertia) * deltaTime;

    // Apply lateral acceleration to velocity
    const totalLateralForce = frontLateralForce + rearLateralForce;
    const lateralAcceleration = totalLateralForce / this.params.mass;

    // Convert lateral acceleration to world coordinates
    const cosHeading = Math.cos(this.heading);
    const sinHeading = Math.sin(this.heading);

    // Lateral direction is perpendicular to heading
    const lateralX = -sinHeading;
    const lateralZ = cosHeading;

    this.velocity.x += lateralAcceleration * lateralX * deltaTime;
    this.velocity.z += lateralAcceleration * lateralZ * deltaTime;
  }

  private calculateLateralForce(
    slipAngle: number,
    gripMultiplier: number,
    leverArm: number,
    speed: number
  ): number {
    // Simplified tire model - linear up to a point, then saturates
    const maxForce = gripMultiplier * this.params.mass * 9.81 * 0.7; // 70% of weight for lateral grip
    const linearRegion = (Math.PI / 180) * 3; // 3 degrees linear

    // Speed factor to taper lateral force near standstill (prevents spinning in place)
    const speedFactor = Math.min(1, Math.max(0, (speed - 0.5) / 6));

    if (Math.abs(slipAngle) < linearRegion) {
      // Linear region
      return (slipAngle / linearRegion) * maxForce * speedFactor;
    } else {
      // Saturated region
      return Math.sign(slipAngle) * maxForce * speedFactor;
    }
  }

  getKinematics(): CarKinematics {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      heading: this.heading,
      angularVelocity: this.angularVelocity,
      speed: this.speed,
      driftAngle: this.driftAngle,
      velocityHeading: this.velocityHeading,
    };
  }

  setPose(x: number, z: number, heading: number): void {
    this.position = { x, z };
    this.velocity = { x: 0, z: 0 };
    this.heading = heading;
    this.angularVelocity = 0;
    this.speed = 0;
    this.driftAngle = 0;
    this.velocityHeading = heading;
  }

  getSteerAngle(steerInput: number): number {
    return steerInput * this.params.maxSteer;
  }

  // Constrain car to track boundary using nearest centerline sample info
  // samplePos: centerline position (x,z), sampleNormal: unit normal (x,z)
  // If outside width/2 + tolerance, snap to boundary and remove outward lateral velocity
  constrainToTrack(
    samplePosX: number,
    samplePosZ: number,
    normalX: number,
    normalZ: number,
    trackWidth: number,
    tolerance = 0.1
  ): void {
    const half = trackWidth / 2;
    const toPosX = this.position.x - samplePosX;
    const toPosZ = this.position.z - samplePosZ;
    const lateral = toPosX * normalX + toPosZ * normalZ; // signed distance from centerline
    if (Math.abs(lateral) <= half + tolerance) return;

    // Snap position to boundary just inside the edge
    const targetLateral = Math.sign(lateral) * (half - 0.05);
    this.position.x = samplePosX + normalX * targetLateral;
    this.position.z = samplePosZ + normalZ * targetLateral;

    // Remove outward lateral velocity component to avoid re-exiting immediately
    const vLat = this.velocity.x * normalX + this.velocity.z * normalZ;
    if (Math.sign(vLat) === Math.sign(lateral)) {
      // subtract outward component
      this.velocity.x -= vLat * normalX;
      this.velocity.z -= vLat * normalZ;
    }
    // Dampen overall speed slightly on contact
    this.velocity.x *= 0.9;
    this.velocity.z *= 0.9;
  }
}
