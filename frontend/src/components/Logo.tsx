import { arc } from "d3-shape";
import { range } from "lodash";

const radius = 58;
const sides = 3;
const layers = 3;
const thickness = 4;
const gap = 8;
const color = "currentColor";
const arrow = 16;

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

const arrowPath = [
  `M ${0.666 * arrow} 0`,
  `H ${-radius + 2 * arrow}`,
  `a ${2 * arrow} ${2 * arrow} 0 0 0 ${-2 * arrow} ${2 * arrow}`,
  `M ${0.666 * arrow} 0`,
  `m ${-arrow} ${-arrow}`,
  `l ${arrow} ${arrow}`,
  `l ${-arrow} ${arrow}`,
].join(" ");

const Logo = () => {
  return (
    <svg
      ref={(el) => {
        if (!el) return;
        const { x, y, width, height } = el.getBBox();
        el.setAttribute("viewBox", [x, y, width, height].join(" "));
      }}
      xmlns="http://www.w3.org/2000/svg"
      height="1.5em"
      style={{ overflow: "visible" }}
    >
      <g>
        {segmentPaths.map(({ path }, index) => (
          <path key={index} d={path} fill={color} mask="url(#clip)" />
        ))}

        <mask id="clip">
          <rect
            x={-radius}
            y={-radius}
            width={2 * radius}
            height={2 * radius}
            fill="white"
          />
          <path
            d={arrowPath}
            fill="none"
            stroke="black"
            strokeWidth={6 * thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>

        <path
          d={arrowPath}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default Logo;
