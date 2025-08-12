export interface HUDData {
    speedKmh: number;
    driftDeg: number;
    isDrifting: boolean;
    offTrack: boolean;
}
export declare class HUD {
    private container;
    private hudRoot;
    private speedElement;
    private driftAngleElement;
    private driftIndicator;
    private offTrackBanner;
    constructor(container: HTMLElement);
    private createHUD;
    update(data: HUDData): void;
    dispose(): void;
}
