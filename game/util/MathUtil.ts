export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function wrapAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function smoothStep(value: number, target: number, smoothTime: number, deltaTime: number): number {
  const alpha = 1 - Math.exp(-deltaTime / smoothTime);
  return lerp(value, target, alpha);
}

export function lowPassFilter(value: number, target: number, cutoffFreq: number, deltaTime: number): number {
  const alpha = deltaTime * cutoffFreq / (1 + deltaTime * cutoffFreq);
  return value + alpha * (target - value);
}

export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}

export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}