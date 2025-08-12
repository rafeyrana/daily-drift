import { smoothStep } from '../util/MathUtil';
export class Input {
    keys = new Map();
    lastTime = 0;
    throttleValue = 0;
    brakeValue = 0;
    steerValue = 0;
    // Smoothing time constants (in seconds)
    throttleRiseTime = 0.08;
    throttleFallTime = 0.12;
    brakeRiseTime = 0.06;
    brakeFallTime = 0.1;
    steerRiseTime = 0.05;
    steerFallTime = 0.08;
    // Drift combo detection
    lastSteerDirection = 0;
    steerDirectionChangeTime = 0;
    lastSteerMagnitude = 0;
    constructor() {
        this.setupKeys();
    }
    setupKeys() {
        const keyNames = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        for (const key of keyNames) {
            this.keys.set(key, {
                pressed: false,
                pressTime: 0,
                releaseTime: 0,
            });
        }
    }
    attach(container) {
        const doc = container.ownerDocument;
        doc.addEventListener('keydown', this.onKeyDown);
        doc.addEventListener('keyup', this.onKeyUp);
        // Prevent default arrow key behavior
        doc.addEventListener('keydown', this.preventArrowDefaults);
    }
    detach(container) {
        const doc = container.ownerDocument;
        doc.removeEventListener('keydown', this.onKeyDown);
        doc.removeEventListener('keyup', this.onKeyUp);
        doc.removeEventListener('keydown', this.preventArrowDefaults);
    }
    preventArrowDefaults = (event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }
    };
    onKeyDown = (event) => {
        const key = this.keys.get(event.code);
        if (key && !key.pressed) {
            key.pressed = true;
            key.pressTime = performance.now();
        }
    };
    onKeyUp = (event) => {
        const key = this.keys.get(event.code);
        if (key && key.pressed) {
            key.pressed = false;
            key.releaseTime = performance.now();
        }
    };
    update(deltaTime, speed) {
        this.lastTime += deltaTime;
        // Get raw input states
        const upPressed = this.keys.get('ArrowUp')?.pressed || false;
        const downPressed = this.keys.get('ArrowDown')?.pressed || false;
        const leftPressed = this.keys.get('ArrowLeft')?.pressed || false;
        const rightPressed = this.keys.get('ArrowRight')?.pressed || false;
        // Update smoothed values
        const targetThrottle = upPressed ? 1 : 0;
        const targetBrake = downPressed ? 1 : 0;
        const targetSteer = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
        // Apply smoothing with different rise/fall times
        const throttleTime = targetThrottle > this.throttleValue ? this.throttleRiseTime : this.throttleFallTime;
        const brakeTime = targetBrake > this.brakeValue ? this.brakeRiseTime : this.brakeFallTime;
        const steerTime = Math.abs(targetSteer) > Math.abs(this.steerValue) ? this.steerRiseTime : this.steerFallTime;
        this.throttleValue = smoothStep(this.throttleValue, targetThrottle, throttleTime, deltaTime);
        this.brakeValue = smoothStep(this.brakeValue, targetBrake, brakeTime, deltaTime);
        this.steerValue = smoothStep(this.steerValue, targetSteer, steerTime, deltaTime);
        // Speed-based steering reduction
        const speedFactor = Math.min(1.0, Math.max(0.3, 1 - (speed - 10) / 40)); // Reduce steering at high speeds, clamp to 1
        const steer = this.steerValue * speedFactor;
        // Detect drift combo events
        const events = this.detectEvents(speed);
        return {
            state: {
                throttle: this.throttleValue,
                brake: this.brakeValue,
                steer,
            },
            events,
        };
    }
    detectEvents(speed) {
        const currentTime = performance.now();
        let brakeTap = false;
        let feintSwitch = false;
        // Brake-tap detection
        const downKey = this.keys.get('ArrowDown');
        if (downKey && !downKey.pressed && downKey.releaseTime > 0) {
            const tapDuration = downKey.releaseTime - downKey.pressTime;
            const timeSinceRelease = currentTime - downKey.releaseTime;
            // Check if this was a valid brake tap
            if (tapDuration >= 80 &&
                tapDuration <= 250 &&
                timeSinceRelease < 100 && // Recent
                speed >= 10 &&
                Math.abs(this.steerValue) >= 0.25) {
                brakeTap = true;
                // Clear the release time to prevent multiple detections
                downKey.releaseTime = 0;
            }
        }
        // Feint detection (steering direction reversal)
        const currentSteerMag = Math.abs(this.steerValue);
        const currentSteerDir = Math.sign(this.steerValue);
        if (currentSteerMag >= 0.35 &&
            this.lastSteerMagnitude >= 0.35 &&
            currentSteerDir !== this.lastSteerDirection &&
            currentSteerDir !== 0 &&
            this.lastSteerDirection !== 0) {
            const timeSinceDirectionChange = this.lastTime * 1000 - this.steerDirectionChangeTime;
            if (timeSinceDirectionChange <= 200) {
                const upKey = this.keys.get('ArrowUp');
                if (upKey?.pressed && speed >= 9) {
                    feintSwitch = true;
                }
            }
            this.steerDirectionChangeTime = this.lastTime * 1000;
        }
        // Update steering direction tracking
        if (currentSteerDir !== this.lastSteerDirection && currentSteerMag >= 0.35) {
            this.lastSteerDirection = currentSteerDir;
            this.steerDirectionChangeTime = this.lastTime * 1000;
        }
        this.lastSteerMagnitude = currentSteerMag;
        return { brakeTap, feintSwitch };
    }
    getInputs() {
        return {
            state: {
                throttle: this.throttleValue,
                brake: this.brakeValue,
                steer: this.steerValue,
            },
            events: {
                brakeTap: false,
                feintSwitch: false,
            },
        };
    }
}
//# sourceMappingURL=Input.js.map