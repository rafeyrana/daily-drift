# Daily Drift Game Module

A self-contained arcade drifting game built with Three.js featuring realistic drift physics, smooth camera controls, and satisfying drift mechanics.

## Features

- **Oval Track**: Procedurally generated elliptical race track with configurable dimensions
- **Drift Physics**: Kinematic bicycle model with realistic drift state machine
- **Three Drift Initiation Methods**:
  - **Brake-tap**: Quick brake tap while steering at speed
  - **Power-over**: Oversteer with throttle and steering
  - **Feint**: Quick steering direction changes
- **Chase Camera**: Spring-damped follow camera with banking
- **HUD**: Speed, drift angle, and drift status indicators
- **Fixed Timestep Physics**: Deterministic 120Hz physics simulation

## Quick Start

```typescript
import { mountGame, unmountGame } from './game';

// Mount the game
const container = document.getElementById('game-container');
mountGame(container);

// Later, unmount to clean up
unmountGame();
```

## Controls

### Basic Controls
- **Arrow Up (↑)**: Throttle / Accelerate
- **Arrow Down (↓)**: Brake (or Reverse when stopped)
- **Arrow Left (←)**: Steer Left
- **Arrow Right (→)**: Steer Right

### Drift Combos

#### 1. Brake-Tap Initiation (Recommended)
- **Prerequisites**: Speed ≥ 10 m/s (36 km/h), steering engaged
- **Technique**: Hold steering direction, quickly tap brake (80-250ms), then throttle
- **Effect**: Instant rear grip loss and controlled oversteer

#### 2. Power-Over Initiation
- **Prerequisites**: Speed ≥ 8 m/s (29 km/h)
- **Technique**: Hold throttle and gradually increase steering input
- **Effect**: Progressive rear-end breakaway from power

#### 3. Feint Initiation
- **Prerequisites**: Speed ≥ 9 m/s (32 km/h), throttle engaged
- **Technique**: Quick steering flick (left-right or right-left) within 200ms
- **Effect**: Weight transfer induces drift in the second direction

### Drift Maintenance
- **Countersteer**: Use steering to control drift angle
- **Throttle**: Increases drift angle (up to ~35-40° max)
- **Brake**: Reduces drift angle and speed
- **Smooth Inputs**: Avoid abrupt changes to maintain control

## Options

```typescript
interface GameOptions {
  // Track parameters
  majorRadius: number;     // Default: 60m
  minorRadius: number;     // Default: 40m
  trackWidth: number;      // Default: 8m
  samples: number;         // Default: 512
  
  // Physics parameters
  wheelBase: number;       // Default: 2.6m
  mass: number;           // Default: 1200kg
  maxSteer: number;       // Default: 0.6 rad (~34°)
  engineForce: number;    // Default: 8000N
  brakeForce: number;     // Default: 12000N
  
  // Visual parameters
  enableWalls: boolean;   // Default: true
  cameraDistance: number; // Default: 8m
  cameraHeight: number;   // Default: 4m
}

// Example with custom options
mountGame(container, {
  majorRadius: 80,
  minorRadius: 50,
  trackWidth: 10,
  engineForce: 10000
});
```

## HUD Elements

- **Speed**: Current speed in km/h (top-left)
- **Drift Angle**: Current drift angle in degrees (below speed)
- **DRIFT Indicator**: Appears when drifting (top-right)
  - Orange: Normal drift (5-30°)
  - Red: High angle drift (>30°)
- **OFF TRACK Banner**: Warning when outside track boundaries
- **Controls Reference**: Always visible (bottom-left)

## Physics Details

### Bicycle Model
The car uses a kinematic bicycle model with:
- Fixed timestep simulation (120 Hz)
- Slip angle approximation
- Separate front/rear grip multipliers
- Lateral damping for stability

### Drift State Machine
1. **Grip**: Normal driving with full traction
2. **Initiation**: Brief window of grip reduction (350ms)
3. **Drift**: Active drifting with reduced rear grip
4. **Recovery**: Gradual return to grip state

### Performance
- Target: 60 FPS on mid-tier hardware
- Fixed physics timestep prevents simulation instability
- Maximum 5 physics substeps per frame
- Efficient geometry and materials

## Integration Example

```typescript
// In your client application
import { mountGame, unmountGame } from '../game';

class GameView {
  private gameContainer: HTMLElement;
  
  constructor() {
    this.gameContainer = document.createElement('div');
    this.gameContainer.style.width = '100%';
    this.gameContainer.style.height = '100%';
    document.body.appendChild(this.gameContainer);
    
    mountGame(this.gameContainer, {
      majorRadius: 70,
      minorRadius: 45,
      enableWalls: true
    });
  }
  
  destroy() {
    unmountGame();
    if (this.gameContainer.parentNode) {
      this.gameContainer.parentNode.removeChild(this.gameContainer);
    }
  }
}
```

## Tips for Best Experience

1. **Speed Range**: Drift combos work best between 30-60 km/h
2. **Smooth Inputs**: Avoid jerky steering movements
3. **Brake-Tap Timing**: Practice the 80-250ms brake tap window
4. **Countersteer**: Use opposite steering to control drift angle
5. **Track Learning**: Learn the oval shape for consistent lap times

## Troubleshooting

### Common Issues

**Car won't drift:**
- Ensure sufficient speed (>30 km/h)
- Check steering input magnitude (>25% for brake-tap)
- Try different initiation methods

**Unstable physics:**
- Fixed timestep should prevent this
- Check browser performance and frame rate

**Camera too close/far:**
- Adjust `cameraDistance` and `cameraHeight` options
- Camera follows with spring damping for smoothness

**Controls not working:**
- Ensure container has focus
- Check for other event listeners blocking arrow keys
- Verify the container is properly mounted in DOM

## Performance Notes

- Uses WebGL with hardware acceleration
- Optimized geometry with minimal draw calls
- Fixed timestep physics prevents performance-dependent behavior
- Memory-efficient disposal on unmount