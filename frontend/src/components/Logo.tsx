import type { ComponentProps } from "react";
import { arc } from "d3-shape";
import { range } from "lodash";
import { parseSVG } from "svg-path-parser";

const radius = 58;
const sides = 3;
const layers = 3;
const thickness = 4;
const gap = 10;
const arrow = 16;

const theme = "hsl(220, 30%, 50%)";
const accent = "hsl(0, 60%, 60%)";

const tau = 2 * Math.PI;

const segmentPaths = range(layers)
  .map((layer) =>
    range(sides).map((side) => {
      const outerRadius = radius - layer * (thickness + gap);
      const innerRadius = outerRadius - thickness;

      side += 0.25;
      side += layer % 2 === 0 ? 0 : 0.5;

      const startAngle = side / sides;
      const endAngle = (side + 1) / sides;

      const path = arc<null>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(tau * startAngle)
        .endAngle(tau * endAngle)
        .padAngle(1)
        .padRadius(gap)
        .cornerRadius(999)(null)!;

      return { path };
    }),
  )
  .flat();

const points = segmentPaths.map(({ path }) => {
  const points = parseSVG(path).filter((point) => "x" in point && "y" in point);
  return {
    start: {
      x: (points.at(1)!.x + points.at(6)!.x) / 2,
      y: (points.at(1)!.y + points.at(6)!.y) / 2,
    },
    end: {
      x: (points.at(2)!.x + points.at(5)!.x) / 2,
      y: (points.at(2)!.y + points.at(5)!.y) / 2,
    },
  };
});

const shaftPath = [`M ${0.666 * arrow} 0`, `H ${-radius}`].join(" ");

const arrowPath = [
  shaftPath,
  `M ${0.666 * arrow} 0`,
  `m ${-arrow} ${-arrow}`,
  `l ${arrow} ${arrow}`,
  `l ${-arrow} ${arrow}`,
].join(" ");

const Logo = ({
  color,
  ...props
}: { color?: string } & ComponentProps<"svg">) => {
  return (
    <svg
      ref={(el) => {
        if (!el) return;
        const { x, y, width, height } = el.getBBox();
        el.setAttribute(
          "viewBox",
          [x, y, width, height].map(Math.round).join(" "),
        );
      }}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask id="clip">
        <rect
          x={-radius}
          y={-radius}
          width={2 * radius}
          height={2 * radius}
          fill="white"
        />
        <path
          d={shaftPath}
          fill="none"
          stroke="black"
          strokeWidth={6 * thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>

      {segmentPaths.map(({ path }, index) => (
        <path key={index} d={path} fill={color ?? theme} mask="url(#clip)" />
      ))}
      {points.map(({ end }, index) => (
        <circle
          key={index}
          cx={end.x}
          cy={end.y}
          r={thickness}
          fill={color ?? theme}
          mask="url(#clip)"
        />
      ))}

      <path
        d={arrowPath}
        fill="none"
        stroke={color ?? accent}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
