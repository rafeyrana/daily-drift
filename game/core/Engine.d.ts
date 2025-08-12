import * as THREE from 'three';
export interface EngineHooks {
    onFixedUpdate?: (dt: number) => void;
    onRender?: (interpAlpha: number) => void;
    onResize?: (width: number, height: number) => void;
}
export declare class Engine {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    private container;
    private timeStep;
    private animationId;
    private hooks;
    private resizeObserver;
    constructor(container: HTMLElement);
    private setupContainer;
    private setupResize;
    private handleResize;
    setHooks(hooks: EngineHooks): void;
    start(): void;
    stop(): void;
    private animate;
    dispose(): void;
}
