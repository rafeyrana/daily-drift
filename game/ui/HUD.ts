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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: white;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
      z-index: 1000;
    `;
    
    // Speed display
    this.speedElement = document.createElement('div');
    this.speedElement.style.cssText = `
      position: absolute;
      top: 15px;
      left: 15px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.5));
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    this.speedElement.textContent = '0 km/h';
    
    // Drift angle display
    this.driftAngleElement = document.createElement('div');
    this.driftAngleElement.style.cssText = `
      position: absolute;
      top: 70px;
      left: 15px;
      font-size: 16px;
      font-weight: 500;
      padding: 4px 8px;
      background: rgba(0,0,0,0.6);
      border-radius: 4px;
      border-left: 3px solid #ffd700;
    `;
    this.driftAngleElement.textContent = '0°';
    
    // Drift indicator
    this.driftIndicator = document.createElement('div');
    this.driftIndicator.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      font-size: 36px;
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 0 12px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.9);
      opacity: 0;
      transition: opacity 0.2s, color 0.3s;
      letter-spacing: 2px;
      padding: 8px 16px;
      background: linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
      border-radius: 8px;
      border: 2px solid rgba(255, 215, 0, 0.3);
    `;
    this.driftIndicator.textContent = 'DRIFT';
    
    // Off-track banner
    this.offTrackBanner = document.createElement('div');
    this.offTrackBanner.style.cssText = `
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, rgba(220, 38, 127, 0.95), rgba(239, 68, 68, 0.95));
      padding: 12px 20px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(220, 38, 127, 0.4);
      opacity: 0;
      transition: opacity 0.25s ease-out;
      letter-spacing: 1px;
    `;
    this.offTrackBanner.textContent = 'OFF TRACK';
    
    // Controls info (bottom) - NASCAR styled
    const controlsInfo = document.createElement('div');
    controlsInfo.style.cssText = `
      position: absolute;
      bottom: 15px;
      left: 15px;
      font-size: 12px;
      color: rgba(255,255,255,0.9);
      line-height: 1.5;
      background: rgba(0,0,0,0.6);
      padding: 10px 12px;
      border-radius: 4px;
      border-left: 3px solid #ffd700;
      font-weight: 500;
    `;
    controlsInfo.innerHTML = `
      <div style="color: #ffd700; font-weight: 600; margin-bottom: 4px;">CONTROLS</div>
      ↑ Throttle  ↓ Brake/Reverse  ← → Steer<br>
      <div style="color: #ffd700; font-weight: 600; margin: 6px 0 2px 0;">DRIFT TECHNIQUES</div>
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
        this.driftIndicator.style.textShadow = '0 0 15px rgba(255, 51, 51, 0.9), 2px 2px 4px rgba(0,0,0,0.9)';
        this.driftIndicator.style.borderColor = 'rgba(255, 51, 51, 0.5)';
      } else {
        this.driftIndicator.style.color = '#ffd700';
        this.driftIndicator.style.textShadow = '0 0 12px rgba(255, 215, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.9)';
        this.driftIndicator.style.borderColor = 'rgba(255, 215, 0, 0.3)';
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