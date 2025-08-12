import { InputEvents, InputState } from '../core/Input';

export enum DriftState {
  Grip = 'grip',
  Initiation = 'initiation',
  Drift = 'drift',
  Recovery = 'recovery',
}

export interface DriftEffects {
  rearGripMultiplier: number;
  frontGripMultiplier: number;
  yawTorque: number; // Torque applied during initiation window (N·m)
}

export interface DriftStatus {
  state: DriftState;
  isDrifting: boolean;
  driftAngle: number; // In radians
}

export class DriftController {
  private state = DriftState.Grip;
  private stateTimer = 0;
  private yawImpulse = 0; // cached impulse-like magnitude for conversion
  private yawImpulseTimer = 0;

  // State transition timers
  private readonly initiationDuration = 0.35; // 350ms
  private readonly recoveryThreshold = 0.25; // 250ms
  private readonly idleExitThreshold = 0.4; // 400ms

  // Grip multiplier ranges
  private readonly gripMultipliers = {
    normal: { rear: 0.9, front: 1.0 },
    brakeTap: { rear: 0.6, front: 1.0 },
    powerOver: { rear: 0.75, front: 1.0 },
    feint: { rear: 0.7, front: 1.0 },
    drift: { rear: 0.65, front: 0.95 },
  };

  // Thresholds
  private readonly driftAngleThreshold = (Math.PI / 180) * 8; // 8 degrees
  private readonly exitAngleThreshold = (Math.PI / 180) * 5; // 5 degrees
  private readonly maxDriftAngle = (Math.PI / 180) * 38; // 38 degrees

  private lastInputs: InputState = { throttle: 0, brake: 0, steer: 0 };
  private idleTimer = 0;

  update(
    deltaTime: number,
    inputs: InputState,
    events: InputEvents,
    speed: number,
    driftAngle: number
  ): DriftEffects {
    this.stateTimer += deltaTime;
    this.yawImpulseTimer += deltaTime;

    const absDriftAngle = Math.abs(driftAngle);

    // Check for idle inputs (for exit condition)
    const isIdle = Math.abs(inputs.steer) < 0.1 && inputs.throttle < 0.1;
    if (isIdle) {
      this.idleTimer += deltaTime;
    } else {
      this.idleTimer = 0;
    }

    // State machine logic
    switch (this.state) {
      case DriftState.Grip:
        this.handleGripState(inputs, events, speed, absDriftAngle);
        break;

      case DriftState.Initiation:
        this.handleInitiationState(inputs, speed, absDriftAngle);
        break;

      case DriftState.Drift:
        this.handleDriftState(inputs, speed, absDriftAngle);
        break;

      case DriftState.Recovery:
        this.handleRecoveryState(inputs, speed, absDriftAngle);
        break;
    }

    this.lastInputs = { ...inputs };

    return this.calculateEffects(driftAngle);
  }

  private handleGripState(
    inputs: InputState,
    events: InputEvents,
    speed: number,
    absDriftAngle: number
  ): void {
    // Check for drift initiation
    if (this.checkBrakeTapInitiation(events, inputs, speed)) {
      this.initiateBreakTap(inputs.steer);
    } else if (this.checkPowerOverInitiation(inputs, speed)) {
      this.initiatePowerOver();
    } else if (this.checkFeintInitiation(events, inputs, speed)) {
      this.initiateFeint(inputs.steer);
    }
  }

  private handleInitiationState(inputs: InputState, speed: number, absDriftAngle: number): void {
    // Check if we've transitioned to full drift
    if (absDriftAngle >= this.driftAngleThreshold && this.getRearGripMultiplier() < 0.85) {
      this.transitionTo(DriftState.Drift);
    } else if (this.stateTimer >= this.initiationDuration) {
      // Initiation timeout - return to grip
      this.transitionTo(DriftState.Grip);
    }
  }

  private handleDriftState(inputs: InputState, speed: number, absDriftAngle: number): void {
    // Check exit conditions
    if (speed < 3) {
      this.transitionTo(DriftState.Grip);
    } else if (
      absDriftAngle < this.exitAngleThreshold &&
      this.stateTimer > this.recoveryThreshold
    ) {
      this.transitionTo(DriftState.Recovery);
    } else if (this.idleTimer > this.idleExitThreshold) {
      this.transitionTo(DriftState.Recovery);
    }
  }

  private handleRecoveryState(inputs: InputState, speed: number, absDriftAngle: number): void {
    // Quick transition back to grip once stable
    if (absDriftAngle < this.exitAngleThreshold) {
      this.transitionTo(DriftState.Grip);
    } else if (this.stateTimer > 0.5) {
      // Recovery timeout
      this.transitionTo(DriftState.Grip);
    }
  }

  private checkBrakeTapInitiation(events: InputEvents, inputs: InputState, speed: number): boolean {
    return events.brakeTap && speed >= 10 && Math.abs(inputs.steer) >= 0.25;
  }

  private checkPowerOverInitiation(inputs: InputState, speed: number): boolean {
    return speed >= 8 && inputs.throttle > 0.7 && Math.abs(inputs.steer) >= 0.35;
  }

  private checkFeintInitiation(events: InputEvents, inputs: InputState, speed: number): boolean {
    return events.feintSwitch && speed >= 9 && inputs.throttle > 0.3;
  }

  private initiateBreakTap(steerInput: number): void {
    this.transitionTo(DriftState.Initiation);
    this.yawImpulse = Math.sign(steerInput) * 15; // nominal impulse units
    this.yawImpulseTimer = 0;
  }

  private initiatePowerOver(): void {
    this.transitionTo(DriftState.Initiation);
    this.yawImpulse = 0; // No immediate impulse, gradual grip loss
    this.yawImpulseTimer = 0;
  }

  private initiateFeint(steerInput: number): void {
    this.transitionTo(DriftState.Initiation);
    this.yawImpulse = -Math.sign(steerInput) * 12; // Opposite direction impulse
    this.yawImpulseTimer = 0;
  }

  private transitionTo(newState: DriftState): void {
    this.state = newState;
    this.stateTimer = 0;

    // Reset yaw impulse on state changes (except during initiation)
    if (newState !== DriftState.Initiation) {
      this.yawImpulse = 0;
    }
  }

  private getRearGripMultiplier(): number {
    switch (this.state) {
      case DriftState.Grip:
        return this.gripMultipliers.normal.rear;
      case DriftState.Initiation:
        // Blend grip based on initiation method and timer
        const progress = this.stateTimer / this.initiationDuration;
        if (this.yawImpulse !== 0) {
          // Brake tap or feint - quick grip drop
          return this.gripMultipliers.brakeTap.rear;
        } else {
          // Power over - gradual grip drop
          const targetGrip = this.gripMultipliers.powerOver.rear;
          return (
            this.gripMultipliers.normal.rear +
            (targetGrip - this.gripMultipliers.normal.rear) * progress
          );
        }
      case DriftState.Drift:
        return this.gripMultipliers.drift.rear;
      case DriftState.Recovery:
        // Gradual return to normal grip
        const recoveryProgress = Math.min(this.stateTimer / 0.3, 1);
        return (
          this.gripMultipliers.drift.rear +
          (this.gripMultipliers.normal.rear - this.gripMultipliers.drift.rear) * recoveryProgress
        );
      default:
        return this.gripMultipliers.normal.rear;
    }
  }

  private getFrontGripMultiplier(): number {
    switch (this.state) {
      case DriftState.Drift:
        return this.gripMultipliers.drift.front;
      case DriftState.Initiation:
      case DriftState.Recovery:
        return this.gripMultipliers.normal.front;
      default:
        return this.gripMultipliers.normal.front;
    }
  }

  private calculateEffects(driftAngle: number): DriftEffects {
    const rearGripMultiplier = this.getRearGripMultiplier();
    const frontGripMultiplier = this.getFrontGripMultiplier();

    // Convert short impulse into torque over a brief window (~0.1s)
    let yawTorque = 0;
    if (this.state === DriftState.Initiation && this.yawImpulseTimer < 0.1) {
      const window = 0.1;
      yawTorque = this.yawImpulse / window; // N·m equivalent over window
    }

    return {
      rearGripMultiplier,
      frontGripMultiplier,
      yawTorque,
    };
  }

  getStatus(driftAngle: number): DriftStatus {
    const absDriftAngle = Math.abs(driftAngle);
    const isDrifting =
      absDriftAngle >= this.driftAngleThreshold && this.getRearGripMultiplier() < 0.85;

    return {
      state: this.state,
      isDrifting,
      driftAngle,
    };
  }
}
