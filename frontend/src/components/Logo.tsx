import type { ComponentProps } from "react";
import { range } from "lodash";
import { useTheme } from "@/util/hooks";

/** params */
const bounds = 56;
const size = 48;
const sides = 3;
const layers = 3;
const thickness = 4;
const spacing = 12;
const head = 12;

/** 2 pi */
const tau = 2 * Math.PI;

/** arc segments */
const segments = range(layers)
  .map((layer) =>
    range(sides).map((side) => {
      /** layer radius */
      const radius = size - layer * spacing;

      /** stagger rotations */
      side += layer % 2 === 0 ? 0 : 0.5;

      /** start/end angles */
      let startAngle = tau * (side / sides);
      let endAngle = tau * ((side + 1) / sides);

      /** add gap */
      startAngle += (0.5 * spacing) / radius;
      endAngle -= (0.5 * spacing) / radius;

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

/** arrow shape */
const arrow = [
  `M ${0.666 * head} 0`,
  `H ${-size + 0.5 * head}`,
  `m 0 0`,
  `a ${-0.5 * head} ${0.5 * head} 0 0 0 ${-head} 0`,
  `a ${-0.5 * head} ${0.5 * head} 0 0 0 ${head} 0`,
  `M ${0.666 * head} 0`,
  `m ${-head} ${-head}`,
  `l ${head} ${head}`,
  `l ${-head} ${head}`,
].join(" ");

type Props = { color?: string } & ComponentProps<"svg">;

export default function Logo({ color, ...props }: Props) {
  const theme = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={[-bounds, -bounds, 2 * bounds, 2 * bounds].join(" ")}
      strokeWidth={thickness}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <mask id="clip">
        <rect
          x={-bounds}
          y={-bounds}
          width={2 * bounds}
          height={2 * bounds}
          fill="white"
        />
        <path
          d={arrow}
          fill="black"
          stroke="black"
          strokeWidth={4.5 * thickness}
        />
      </mask>

      <g mask="url(#clip)" fill="none" stroke={color ?? theme["--color-theme"]}>
        {segments.map(({ radius, start, end }, index) => (
          <path
            key={index}
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`}
          />
        ))}
      </g>

      <path d={arrow} fill="none" stroke={color ?? theme["--color-accent"]} />
    </svg>
  );
}
