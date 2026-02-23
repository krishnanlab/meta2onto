import type { CSSProperties } from "react";
import clsx from "clsx";
import { range } from "lodash";
import { tau } from "@/util/math";
import classes from "./Rings.module.css";

/** params */
const bounds = 500;
const size = 400;
const sides = 6;
const layers = 6;
const spacing = 20;

const rings = range(layers).map((layer) => {
  /** layer radius */
  const radius = size - layer * spacing;

  return {
    layer,
    radius,
    segments: range(sides).map((side) => {
      /** start/end angles */
      let startAngle = tau * (side / sides);
      let endAngle = tau * ((side + 1) / sides);

      /** add gap */
      startAngle += spacing / radius;
      endAngle -= spacing / radius;

      /** start/end points */
      const start = {
        x: radius * Math.cos(-startAngle),
        y: radius * -Math.sin(-startAngle),
      };
      const end = {
        x: radius * Math.cos(-endAngle),
        y: radius * -Math.sin(-endAngle),
      };

      return { side, start, end };
    }),
  };
});

export default function Ring() {
  return rings.map(({ layer, radius, segments }, index) => (
    <svg
      key={index}
      viewBox={[-bounds, -bounds, 2 * bounds, 2 * bounds].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx(
        `
          absolute top-1/2 left-1/2 size-full -translate-1/2 scale-275
          text-theme
        `,
        classes.svg,
      )}
      style={
        {
          "--layer": layers - layer,
          "--layers": layers,
          "--radius": radius,
        } as CSSProperties
      }
    >
      {segments.map(({ start, end }, index) => (
        <path
          key={index}
          className={classes.path}
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
        />
      ))}
    </svg>
  ));
}
