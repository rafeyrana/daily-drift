import { Game } from './Game';

export interface GameOptions {
  // Track parameters
  majorRadius: number;
  minorRadius: number;
  trackWidth: number;
  samples: number;
  straightLength: number;
  cornerRadiusInner: number;
  cornerRadiusOuter: number;
  bankAngleStraights: number;
  bankAngleCorners: number;
  
  // Physics parameters
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
  
  // Visual parameters
  enableWalls: boolean;
  cameraDistance: number;
  cameraHeight: number;
  shadowQuality: number;
  enableClouds: boolean;
  bodyColor: number;
  asphaltRepeatU: number;
  asphaltRepeatV: number;
  grassRepeatU: number;
  grassRepeatV: number;
}

export const defaultOptions: GameOptions = {
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

let currentGame: Game | null = null;

export function mountGame(container: HTMLElement, options?: Partial<GameOptions>): void {
  if (currentGame) {
    unmountGame();
  }
  
  const mergedOptions = { ...defaultOptions, ...options };
  currentGame = new Game(container, mergedOptions);
  currentGame.start();
}

export function unmountGame(): void {
  if (currentGame) {
    currentGame.stop();
    currentGame = null;
  }
}