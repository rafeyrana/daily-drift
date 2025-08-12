export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function wrapAngle(angle) {
    while (angle > Math.PI)
        angle -= 2 * Math.PI;
    while (angle < -Math.PI)
        angle += 2 * Math.PI;
    return angle;
}
export function smoothStep(value, target, smoothTime, deltaTime) {
    const alpha = 1 - Math.exp(-deltaTime / smoothTime);
    return lerp(value, target, alpha);
}
export function lowPassFilter(value, target, cutoffFreq, deltaTime) {
    const alpha = deltaTime * cutoffFreq / (1 + deltaTime * cutoffFreq);
    return value + alpha * (target - value);
}
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
//# sourceMappingURL=MathUtil.js.map