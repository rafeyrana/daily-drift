import { GameOptions } from './index';
export declare class Game {
    private container;
    private options;
    private engine;
    private input;
    private materials;
    private car;
    private carPhysics;
    private driftController;
    private chaseCamera;
    private hud;
    private centerlineSamples;
    constructor(container: HTMLElement, options: GameOptions);
    private setupEngine;
    private setupInput;
    private setupScene;
    private setupTrack;
    private setupCar;
    private setupCamera;
    private setupHUD;
    private setupEngineHooks;
    private onFixedUpdate;
    private onRender;
    private onResize;
    start(): void;
    stop(): void;
}
