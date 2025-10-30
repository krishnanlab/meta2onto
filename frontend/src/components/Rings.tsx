import type { ComponentProps } from "react";
import { range } from "lodash";

/** params */
const bounds = 50;
const size = 48;
let sides = 16;
const layers = 12;
const thickness = 0.33;
const spacing = 3;

/** 2 pi */
const tau = 2 * Math.PI;

/** arc segments */
const segments = range(layers)
  .map((layer) =>
    range(sides--).map((side) => {
      /** layer radius */
      const radius = size - layer * spacing;

      /** stagger rotations */
      side += (layer / layers) % 1;

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
      <g fill="none" stroke="currentColor">
        {segments.map(({ layer, radius, start, end }, index) => (
          <path
            key={index}
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
            className="animate-spin"
            style={{
              animationDuration: "20s",
              opacity: 1 - layer / layers,
              animationDirection: layer % 2 === 0 ? "normal" : "reverse",
            }}
          />
        ))}
      </g>
    </svg>
  );
}
