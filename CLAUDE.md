# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Reddit Devvit application called "daily-drift" - a Three.js-based interactive experience that runs on Reddit. The app features a 3D Earth that users can click to increment a counter, built with a client-server architecture.

## Architecture

The codebase follows a modular structure:

- **Client (`src/client/`)**: Three.js WebGL application that renders an interactive 3D Earth. Users click the planet to increment a shared counter. Built with Vite and TypeScript.
- **Server (`src/server/`)**: Express.js serverless backend that handles API endpoints, Redis data persistence, and Reddit integration. Provides `/api/init`, `/api/increment`, `/api/decrement` endpoints.
- **Shared (`src/shared/`)**: Common TypeScript types used across client and server (API response types).
- **Devvit Integration**: Reddit app configuration via `devvit.json` with menu items and triggers for post creation.

## Key Commands

### Development

- `npm run dev`: Starts concurrent development servers (client, server, devvit playtest)
- `npm run dev:client`: Build client with Vite watch mode
- `npm run dev:server`: Build server with Vite watch mode
- `npm run dev:devvit`: Run devvit playtest with environment variables

### Building & Deployment

- `npm run build`: Build both client and server (runs automatically on postinstall)
- `npm run build:client`: Build client only
- `npm run build:server`: Build server only
- `npm run deploy`: Build and upload to Reddit
- `npm run launch`: Build, deploy, and publish for review

### Code Quality

- `npm run check`: Run type-check, lint:fix, and prettier
- `npm run type-check`: TypeScript compilation check across all modules
- `npm run lint`: ESLint check
- `npm run lint:fix`: ESLint with auto-fix
- `npm run prettier`: Format code and package.json

### Reddit Integration

- `npm run login`: Authenticate with Reddit developers platform

## Development Notes

### Client-Server Communication

The client communicates with the server via fetch requests to `/api/*` endpoints. The server uses Redis for data persistence and the Reddit API for user context.

### Three.js Setup

The client uses Three.js with:

- Earth textures (diffuse, normal, specular maps) in `src/client/public/`
- Raycasting for planet click detection
- Animation loop with planet rotation and bounce effects
- Starfield background

### TypeScript Configuration

Uses project references with separate tsconfig.json files for each module (client, server, shared). Main tsconfig.json contains only references.

### Environment Variables

Development uses `.env` file loaded via dotenv-cli for devvit playtest.

### Reddit App Configuration

- App creates posts in development subreddit `daily_drift_dev`
- Menu item allows moderators to create new posts
- Triggers handle app installation
- Uses custom post type with webview integration

## Daily Drift Game MVP (Three.js) — Build Guidance for Claude Code

This repository is pivoting from the Earth-click demo to the Daily Drift game concept. Keep the existing structure and commands intact, but implement the new 3D drifting MVP as an isolated, self-contained module that can be mounted into the existing client webview. No backend changes are required for the MVP.

### Goal (MVP)

- A self-contained arcade drifting demo rendered with Three.js: simple oval track, one car, arrow-key controls, and satisfying drift behavior.
- Implement within an isolated `game/` module exposing a simple mount/unmount API.
- No network calls, no persistence, no asset downloads.

### High-level constraints

- Environment: plain Three.js (no React). TypeScript preferred; JS allowed if documented with JSDoc types.
- Deterministic fixed physics timestep (120 Hz) decoupled from render.
- Clean lifecycle: must mount into and unmount from the client webview without leaks.

### Where to place new code

- Add a new top-level folder `game/` in this package (next to `src/`). It is a pure client-side module.
- Integrate from the client entry by creating a container element and calling `mountGame(container)` when the webview loads; call `unmountGame()` on teardown.

### Public API for the module

- `mountGame(container: HTMLElement, options?: Partial<GameOptions>): void`
  - Creates the renderer, scene, camera, input, track, car, HUD, and starts the loop.
  - Options accept track radii/width and car physics params.
- `unmountGame(): void`
  - Stops the loop, removes listeners, disposes all Three.js resources, and clears the container.

### Folder layout (new)

```
game/
  index.ts                # exports mountGame, unmountGame, default options
  Game.ts                 # orchestrates engine, scene, input, lifecycle
  core/
    Engine.ts             # renderer, scene, camera, loop (fixed-step physics)
    Input.ts              # keyboard input handling and combos
    Time.ts               # fixed step accumulator util
    Dispose.ts            # deep disposal helpers
  physics/
    CarPhysics.ts         # kinematic bicycle + drift state machine hooks
    DriftController.ts    # drift initiation/maintenance (thresholds, timers)
  entities/
    Car.ts                # car mesh creation; sync visuals from physics
  track/
    OvalTrack.ts          # generate oval ribbon mesh + side walls
    TrackUtil.ts          # centerline, nearest-point, off-track checks
  camera/
    ChaseCamera.ts        # spring-damped follow + bank
  ui/
    HUD.ts                # DOM overlay: speed, drift angle, DRIFT badge
  materials/
    Materials.ts          # asphalt, curb, car body/wheel materials
  util/
    MathUtil.ts           # clamp, lerp, wrapAngle, low-pass filters
  README.md               # how to mount, controls, options
```

### Controls (Arrow keys only) and expected behavior

- Arrow Up: throttle 0→1 (smoothed). Acceleration forward.
- Arrow Down: brake 0→1 (smoothed). If speed < 1 m/s, apply reverse torque.
- Arrow Left/Right: steering in [-1, 1] with smoothing and speed-based reduction.
- No dedicated handbrake in MVP — drifting is achieved with combos below.

### Drift mechanics (state machine layered on bicycle model)

- States: Grip → Initiation → Drift → Recovery → Grip.
- Initiation methods (must be implemented):
  - Brake-tap: speed ≥ 10 m/s, |steer| ≥ 0.25, Arrow Down tap 80–250 ms → temporary rear-grip drop to 0.55–0.65 + small yaw impulse.
  - Power-over: speed ≥ 8 m/s, Arrow Up held, |steer| ≥ 0.35 → rear longitudinal slip bias over ~300 ms, rear-grip ≈ 0.75 during ramp.
  - Feint: quick steer reversal (≥ 0.35 to ≤ −0.35 or vice versa) within 200 ms while on throttle and speed ≥ 9 m/s → yaw impulse opposite initial steer + rear-grip ≈ 0.7 for ~300 ms.
- Maintenance: lower rear grip (0.55–0.75), countersteer controls angle, throttle increases angle, brake reduces angle, cap drift angle ~35–40°.
- Exit: |driftAngle| < 5° for 250 ms, or speed < 3 m/s, or idle inputs → return to Grip.
- Drift detection: `beta = wrapAngle(velocityHeading - carHeading)`; drifting if `|beta| ≥ 8°` and rear-grip < 0.85. Show HUD DRIFT indicator when active.

### Physics model (kinematic bicycle, fixed step)

- Parameters (defaults; expose via `GameOptions`):
  - wheelBase=2.6, mass=1200, cgToFront=1.2, cgToRear=1.4, maxSteer=0.6 rad
  - engineForce=8000 N, brakeForce=12000 N, dragCoeff=0.35, frontalArea=2.2 m², airDensity=1.2, rollingResistance=12 N/(m/s)
  - baseFrontGrip=1.0, baseRearGrip=0.9, yawInertia=2400 kg·m², lateralDamping=2.5
- Integrate at Δt = 1/120 s; render decoupled; clamp max 5 substeps/frame.
- Slip approximation: `beta = atan(0.5 * tan(steer * maxSteer))`; `headingDot = (v / wheelBase) * sin(beta)`.
- Apply drag, rolling resistance, engine/brake forces, drift grip multipliers, yaw impulses.

### Track generation (oval)

- Centerline: ellipse `x=a cos t, z=b sin t` with samples (e.g., 512).
- Ribbon: offset ± trackWidth/2 along normal per sample; triangle strip; UVs along arc-length.
- Side walls: optional low boxes for boundary readability.
- Start line: thin rectangle at t=0.
- Off-track: nearest centerline distance > (trackWidth/2 + 0.4 m) → HUD banner.

### Camera and HUD

- Camera: spring-damped chase; look-ahead; bank by steer and drift angle (≤ ~8°).
- HUD (DOM overlay in container): speed (km/h), drift angle (deg), DRIFT badge, Off-track banner.

### Step-by-step build plan (do in this order)

1. Create `game/` structure and files as listed; add `index.ts` that holds `mountGame/unmountGame` and a single `currentGame` reference.
2. Implement `core/Engine.ts` (renderer, scene, camera, RAF loop with fixed-step accumulator). Expose hooks: `onFixedUpdate`, `onRender`, `onResize`.
3. Implement `core/Input.ts` to track Arrow keys, expose smoothed `throttle`, `brake`, `steer` and transient events `brakeTap`, `feintSwitch` with timestamps.
4. Implement `track/OvalTrack.ts` to generate the oval mesh, start line, walls, and centerline samples; `track/TrackUtil.ts` for nearest-point and off-track checks.
5. Implement `materials/Materials.ts` (asphalt, car body, wheels, start line materials).
6. Implement `entities/Car.ts` (Group with body + 4 wheels) and update methods for pose and wheel visuals.
7. Implement `physics/DriftController.ts` with the initiation windows, rear-grip multipliers, and yaw impulse logic; ensure timers and thresholds match the specs above.
8. Implement `physics/CarPhysics.ts` using the bicycle model, applying drift effects, drag/rolling, and lateral damping; expose pose/kinematics getters.
9. Implement `camera/ChaseCamera.ts` with critically-damped spring smoothing and bank.
10. Implement `ui/HUD.ts` overlay; update from current kinematics and drift/off-track flags.
11. Implement `Game.ts` to wire everything: create scene/lights/ground, track, car, camera, input, HUD; place car at start; in fixed updates step physics/drift and compute off-track; in render update camera/HUD.
12. Add `unmountGame()` to stop loop, detach input, dispose renderer/scene/materials/geometries, and empty container.

### Acceptance criteria (must be testable manually)

- Up accelerates; Down brakes; Down reverses when nearly stopped; Left/Right steer with speed-scaled sensitivity.
- Brake-tap + steer at ~40–60 km/h reliably initiates a drift; DRIFT badge visible; countersteer/throttle modulate angle.
- Power-over drift initiates gradually with Up + steer at medium speed.
- Feint drift triggers with quick left-right (or right-left) flick while on throttle.
- Off-track banner appears when outside track; clears when back on.
- Camera is smooth, with slight bank; HUD shows realistic speed and drift angles (5–35° typical in drift).
- Unmount and remount do not leak listeners or WebGL resources.

### Integration into the existing client webview

- On webview init (client side), create a container element and call `mountGame(container)`. On teardown/unmount (e.g., post closed), call `unmountGame()`.
- Keep all MVP logic inside `game/` and avoid touching server or Devvit config for now.

### Roadmap (post-MVP — reference only)

- Daily mode: 3 attempts/day, best time; leaderboard storage via server; track of the day.
- Community tracks: first 10 valid submissions open for voting; winner becomes tomorrow’s track.
- Ghosts: record positions at 20–60 Hz and replay translucent cars.
- Custom cars/maps: presets and tuning (bounded), track editor with curvature/self-intersection checks.
- Rankings: daily tiers and seasonal points; crew leaderboards.
- Anti-cheat: server re-sim from input traces with fixed tick.

### Notes to Claude Code

- Do not change existing Devvit config, commands, or server endpoints for the MVP.
- Keep the new module self-contained and documented in `game/README.md` with controls, mount/unmount instructions, and options.
- Favor readability and deterministic behavior over realism. Ship the drift feel first, then refine.
