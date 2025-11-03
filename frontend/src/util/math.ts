import { clamp } from "lodash";

/** 2 pi */
export const tau = 2 * Math.PI;

/** trig in degrees */
export const sin = (degrees: number) => Math.sin(tau * (degrees / 360));
export const cos = (degrees: number) => Math.cos(tau * (degrees / 360));

/** linear interpolate */
export const lerp = (
  value: number,
  sourceMin: number,
  sourceMax: number,
  targetMin: number,
  targetMax: number,
) =>
  targetMin +
  clamp((value - sourceMin) / (sourceMax - sourceMin || 1), 0, 1) *
    (targetMax - targetMin);

/** 2d distance */
export const dist = (ax = 0, ay = 0, bx = 0, by = 0) =>
  Math.hypot(bx - ax, by - ay);

/** polar to cartesian */
export const polar = (radius: number, angle: number) => ({
  x: radius * cos(angle),
  y: radius * sin(angle),
});

/** deg to rad */
export const rad = (degrees: number) => (degrees / 360) * tau;
