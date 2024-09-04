export const EPSILON = 0.000001; // chosen from gl-matrix

export function equalsTolerance(a, b, tolerance = EPSILON) {
    return Math.abs(a - b) < tolerance;
}

// taken from gl-matrix
export function equalsAutoTolerance(a, b) {
    return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
}

export function degreesToRadians(a) {
    return a * (Math.PI / 180);
}

export function radiansToDegrees(a) {
    return a * (180 / Math.PI);
}

export function clamp(a, min, max) {
    return a < min ? min : a > max ? max : a;
}
