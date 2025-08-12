import { wrapAngle } from '../util/MathUtil';
export class CarPhysics {
    params;
    position = { x: 0, z: 0 };
    velocity = { x: 0, z: 0 };
    heading = 0;
    angularVelocity = 0;
    speed = 0;
    driftAngle = 0;
    velocityHeading = 0;
    constructor(params) {
        this.params = params;
    }
    step(deltaTime, controls, driftEffects) {
        // Update speed first (for direction-independent calculations)
        this.speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        // Calculate velocity heading
        if (this.speed > 0.1) {
            this.velocityHeading = Math.atan2(this.velocity.z, this.velocity.x);
        }
        else {
            this.velocityHeading = this.heading;
        }
        // Calculate drift angle (slip angle)
        this.driftAngle = wrapAngle(this.velocityHeading - this.heading);
        // Apply longitudinal forces and resistive forces
        this.applyLongitudinalAndResistiveForces(deltaTime, controls);
        // Apply lateral dynamics with bicycle model
        this.applyLateralDynamics(deltaTime, controls, driftEffects);
        // Apply yaw torque from drift controller (torque semantics)
        if (Math.abs(driftEffects.yawTorque) > 0) {
            this.angularVelocity += (driftEffects.yawTorque * deltaTime) / this.params.yawInertia;
        }
        // PD stabilization on drift angle and yaw rate
        const angleStiffness = this.params.lateralDamping; // reuse param as stiffness
        const dampingCoeff = this.params.lateralDamping * 0.5;
        const correctiveTorque = -angleStiffness * this.driftAngle - dampingCoeff * this.angularVelocity;
        this.angularVelocity += (correctiveTorque * deltaTime) / this.params.yawInertia;
        // Update heading from angular velocity
        this.heading += this.angularVelocity * deltaTime;
        this.heading = wrapAngle(this.heading);
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        // Clamp maximum forward speed (vector magnitude)
        if (this.speed > 55) {
            const scale = 55 / this.speed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }
        // Cap reverse along heading (longitudinal component only)
        const longSpeed = this.velocity.x * Math.cos(this.heading) + this.velocity.z * Math.sin(this.heading);
        const maxReverse = -15;
        if (longSpeed < maxReverse) {
            const excess = maxReverse - longSpeed;
            this.velocity.x += excess * Math.cos(this.heading);
            this.velocity.z += excess * Math.sin(this.heading);
        }
    }
    applyLongitudinalAndResistiveForces(deltaTime, controls) {
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
            }
            else {
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
            const dragMag = 0.5 *
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
    applyLateralDynamics(deltaTime, controls, driftEffects) {
        if (this.speed < 0.1)
            return; // Skip lateral dynamics at very low speeds
        // Calculate steering angle
        const steerAngle = controls.steer * this.params.maxSteer;
        // Approximate slip angle using bicycle model simplification
        const beta = Math.atan(0.5 * Math.tan(steerAngle));
        // Calculate yaw rate from bicycle model
        const yawRate = (this.speed / this.params.wheelBase) * Math.sin(beta);
        // Calculate lateral forces at front and rear axles
        const frontLateralForce = this.calculateLateralForce(beta, this.params.baseFrontGrip * driftEffects.frontGripMultiplier, this.params.cgToFront);
        const rearLateralForce = this.calculateLateralForce(-this.driftAngle, this.params.baseRearGrip * driftEffects.rearGripMultiplier, this.params.cgToRear);
        // Apply yaw moment
        const yawMoment = frontLateralForce * this.params.cgToFront - rearLateralForce * this.params.cgToRear;
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
    calculateLateralForce(slipAngle, gripMultiplier, leverArm) {
        // Simplified tire model - linear up to a point, then saturates
        const maxForce = gripMultiplier * this.params.mass * 9.81 * 0.7; // 70% of weight for lateral grip
        const linearRegion = (Math.PI / 180) * 3; // 3 degrees linear
        if (Math.abs(slipAngle) < linearRegion) {
            // Linear region
            return (slipAngle / linearRegion) * maxForce;
        }
        else {
            // Saturated region
            return Math.sign(slipAngle) * maxForce;
        }
    }
    getKinematics() {
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
    setPose(x, z, heading) {
        this.position = { x, z };
        this.velocity = { x: 0, z: 0 };
        this.heading = heading;
        this.angularVelocity = 0;
        this.speed = 0;
        this.driftAngle = 0;
        this.velocityHeading = heading;
    }
    getSteerAngle(steerInput) {
        return steerInput * this.params.maxSteer;
    }
}
//# sourceMappingURL=CarPhysics.js.map