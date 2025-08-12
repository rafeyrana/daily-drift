import { Game } from './Game';
export const defaultOptions = {
    // Track
    majorRadius: 60,
    minorRadius: 40,
    trackWidth: 8,
    samples: 512,
    straightLength: 120,
    cornerRadiusInner: 35,
    cornerRadiusOuter: 45,
    bankAngleStraights: 3,
    bankAngleCorners: 12,
    // Physics
    wheelBase: 2.6,
    mass: 1200,
    cgToFront: 1.2,
    cgToRear: 1.4,
    maxSteer: 0.6,
    engineForce: 8000,
    brakeForce: 12000,
    dragCoeff: 0.35,
    frontalArea: 2.2,
    airDensity: 1.2,
    rollingResistance: 12,
    baseFrontGrip: 1.0,
    baseRearGrip: 0.9,
    yawInertia: 2400,
    lateralDamping: 2.5,
    // Visual
    enableWalls: true,
    cameraDistance: 6.5,
    cameraHeight: 3.2,
    shadowQuality: 2048,
    enableClouds: true,
    bodyColor: 0xff4444,
    asphaltRepeatU: 20,
    asphaltRepeatV: 4,
    grassRepeatU: 10,
    grassRepeatV: 10
};
let currentGame = null;
export function mountGame(container, options) {
    if (currentGame) {
        unmountGame();
    }
    const mergedOptions = { ...defaultOptions, ...options };
    currentGame = new Game(container, mergedOptions);
    currentGame.start();
}
export function unmountGame() {
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
}
//# sourceMappingURL=index.js.map