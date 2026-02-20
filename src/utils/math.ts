export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

export function wobbleOffset(seed: number, t: number, amplitude: number = 2): number {
  return Math.sin(t * 3.7 + seed) * amplitude * 0.5 +
         Math.sin(t * 7.1 + seed * 2) * amplitude * 0.3;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function angleToPercent(angle: number, maxAngle: number): number {
  return clamp(angle / maxAngle, -1, 1);
}
