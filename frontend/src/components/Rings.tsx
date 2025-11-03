import type { ComponentProps, CSSProperties } from "react";
import { range } from "lodash";
import { lerp } from "@/util/math";
import classes from "./Rings.module.css";

/** params */
const bounds = 50;
const size = 48;
const sides = 6;
const layers = 12;
const thickness = 0.33;
const spacing = 3;

/** 2 pi */
const tau = 2 * Math.PI;

/** arc segments */
const segments = range(layers)
  .map((layer) =>
    range(sides).map((side) => {
      /** layer radius */
      const radius = size - layer * spacing;

      /** start/end angles */
      let startAngle = tau * (side / sides);
      let endAngle = tau * ((side + 1) / sides);

      /** add gap */
      startAngle += (0.666 * spacing) / radius;
      endAngle -= (0.666 * spacing) / radius;

      /** start/end points */
      const start = {
        x: radius * Math.cos(-startAngle),
        y: radius * -Math.sin(-startAngle),
      };
      const end = {
        x: radius * Math.cos(-endAngle),
        y: radius * -Math.sin(-endAngle),
      };

      return { layer, side, radius, start, end };
    }),
  )
  .flat();

type Props = ComponentProps<"svg">;

export const pulse = () => window.dispatchEvent(new Event("pulse"));

export default function (props: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={[-bounds, -bounds, 2 * bounds, 2 * bounds].join(" ")}
      strokeWidth={thickness}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {segments.map(({ layer, radius, start, end }, index) => {
        const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
        const style = {
          "--percent": layer / layers,
          "--duration": `${lerp((layer + 1) / (layers + 1), 1, 0, 20, 60)}s`,
        } as CSSProperties;
        return (
          <path
            key={index}
            className={classes.ring}
            style={style}
            d={d}
            fill="none"
            stroke="currentColor"
          />
        );
      })}
    </svg>
  );
}
