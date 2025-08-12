export class FixedTimeStep {
  private accumulator = 0;
  private lastTime = 0;
  private readonly fixedStep: number;
  private readonly maxSubSteps: number;
  
  constructor(fixedStep = 1/120, maxSubSteps = 5) {
    this.fixedStep = fixedStep;
    this.maxSubSteps = maxSubSteps;
  }
  
  update(currentTime: number, callback: (dt: number) => void): number {
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return 0;
    }
    
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, this.fixedStep * this.maxSubSteps);
    this.lastTime = currentTime;
    
    this.accumulator += deltaTime;
    
    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < this.maxSubSteps) {
      callback(this.fixedStep);
      this.accumulator -= this.fixedStep;
      steps++;
    }
    
    // Return interpolation alpha for rendering
    return this.accumulator / this.fixedStep;
  }
  
  reset(): void {
    this.accumulator = 0;
    this.lastTime = 0;
  }
}