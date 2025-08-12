export interface HUDData {
  speedKmh: number;
  driftDeg: number;
  isDrifting: boolean;
  offTrack: boolean;
}

export class HUD {
  private container: HTMLElement;
  private hudRoot: HTMLElement;
  private speedElement: HTMLElement;
  private driftAngleElement: HTMLElement;
  private driftIndicator: HTMLElement;
  private offTrackBanner: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.createHUD();
  }
  
  private createHUD(): void {
    // Create HUD root container
    this.hudRoot = document.createElement('div');
    this.hudRoot.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      font-family: 'Courier New', monospace;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      z-index: 1000;
    `;
    
    // Speed display
    this.speedElement = document.createElement('div');
    this.speedElement.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      font-size: 32px;
      font-weight: bold;
    `;
    this.speedElement.textContent = '0 km/h';
    
    // Drift angle display
    this.driftAngleElement = document.createElement('div');
    this.driftAngleElement.style.cssText = `
      position: absolute;
      top: 70px;
      left: 20px;
      font-size: 20px;
    `;
    this.driftAngleElement.textContent = '0°';
    
    // Drift indicator
    this.driftIndicator = document.createElement('div');
    this.driftIndicator.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 48px;
      font-weight: bold;
      color: #ff6600;
      text-shadow: 0 0 10px #ff6600;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    this.driftIndicator.textContent = 'DRIFT';
    
    // Off-track banner
    this.offTrackBanner = document.createElement('div');
    this.offTrackBanner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: bold;
      color: #ff3333;
      background: rgba(0,0,0,0.7);
      padding: 20px 40px;
      border-radius: 10px;
      border: 2px solid #ff3333;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    this.offTrackBanner.textContent = 'OFF TRACK';
    
    // Controls info (bottom)
    const controlsInfo = document.createElement('div');
    controlsInfo.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      font-size: 14px;
      color: rgba(255,255,255,0.8);
      line-height: 1.4;
    `;
    controlsInfo.innerHTML = `
      ↑ Throttle  ↓ Brake/Reverse<br>
      ← → Steer<br>
      <br>
      Drift combos:<br>
      • Brake-tap: ↓ tap + steer<br>
      • Power-over: Hold ↑ + steer<br>
      • Feint: Quick ←→ + throttle
    `;
    
    // Add all elements to HUD root
    this.hudRoot.appendChild(this.speedElement);
    this.hudRoot.appendChild(this.driftAngleElement);
    this.hudRoot.appendChild(this.driftIndicator);
    this.hudRoot.appendChild(this.offTrackBanner);
    this.hudRoot.appendChild(controlsInfo);
    
    // Add HUD to container
    this.container.appendChild(this.hudRoot);
  }
  
  update(data: HUDData): void {
    // Update speed
    const speedText = `${Math.round(data.speedKmh)} km/h`;
    if (this.speedElement.textContent !== speedText) {
      this.speedElement.textContent = speedText;
    }
    
    // Update drift angle
    const driftText = `${Math.round(Math.abs(data.driftDeg))}°`;
    if (this.driftAngleElement.textContent !== driftText) {
      this.driftAngleElement.textContent = driftText;
    }
    
    // Update drift indicator
    if (data.isDrifting) {
      this.driftIndicator.style.opacity = '1';
      // Change color based on drift angle severity
      if (Math.abs(data.driftDeg) > 30) {
        this.driftIndicator.style.color = '#ff3333';
        this.driftIndicator.style.textShadow = '0 0 15px #ff3333';
      } else {
        this.driftIndicator.style.color = '#ff6600';
        this.driftIndicator.style.textShadow = '0 0 10px #ff6600';
      }
    } else {
      this.driftIndicator.style.opacity = '0';
    }
    
    // Update off-track banner
    if (data.offTrack) {
      this.offTrackBanner.style.opacity = '1';
    } else {
      this.offTrackBanner.style.opacity = '0';
    }
  }
  
  dispose(): void {
    if (this.hudRoot && this.hudRoot.parentNode) {
      this.hudRoot.parentNode.removeChild(this.hudRoot);
    }
  }
}