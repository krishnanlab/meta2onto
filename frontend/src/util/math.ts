import { clamp } from "lodash";

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
