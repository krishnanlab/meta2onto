import type { ComponentProps } from "react";
import gsap from "gsap";
import { random, uniqueId } from "lodash";
import { polar, rad } from "@/util/math";

/** params */
const size = 1000;
const layers = 10;
const sides = 6;
const duration = 3;
const tail = 50;
const thickness = 5;
const color = "hsl(220, 100%, 50%)";

/** derived params */
const angleStep = 360 / sides;
const radiusStep = size / layers;

/** objects */
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

type Point = { radius: number; angle: number };

/** animation points state */
const points: Record<string, { point: Point; history: Point[] }> = {};

/** generate new point */
const generate = () => {
  const id = uniqueId();
  /** animation */
  const timeline = gsap.timeline();
  /** initial */
  const point = {
    radius:
      Math.floor((1 - Math.random() * Math.random()) * layers) * radiusStep,
    angle: 90 + random(sides) * angleStep,
  };
  timeline.set(point, { ...point });

  /** until reaches center */
  while (point.radius > 0) {
    /** arc around */
    const dAngle = random(2) * angleStep;
    point.angle += dAngle;
    let length = point.radius * rad(Math.abs(dAngle));
    timeline.to(point, {
      ...point,
      ease: "linear",
      duration: duration * (length / size),
    });
    /** line inward */
    point.radius -= radiusStep;
    length = radiusStep;
    timeline.to(point, {
      ...point,
      ease: "linear",
      duration: duration * (length / size),
    });
  }

  /** last few points */
  const history: Point[] = [];
  points[id] = { point, history };
  /** animation done */
  let done = false;
  /** on tick */
  const onTick = () => {
    /** add point */
    if (!done) history.unshift({ ...point });
    /** chop tail */
    if (history.length > tail || done) history.pop();
    /** if no more tail */
    if (history.length === 0) {
      gsap.ticker.remove(onTick);
      delete points[id];
    }
  };
  gsap.ticker.add(onTick);
  timeline.add(() => {
    done = true;
  });
};

/** generate new point every so often */
window.setInterval(generate, 100);

/** draw frame */
const draw = () => {
  if (!ctx) return;

  /** reset */
  ctx.clearRect(-size, -size, 2 * size, 2 * size);
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;

  /** draw history path */
  for (const { history } of Object.values(points)) {
    for (let step = 0; step < history.length - 1; step++) {
      /** current point */
      const { radius, angle } = history[step]!;
      const { x, y } = polar(radius, angle);

      /** start path */
      if (step === 0) {
        ctx.globalAlpha = radius / size;
        ctx.beginPath();
        ctx.moveTo(x, y);
      } else {
        /** continue point */
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
};

/** gsap params */
gsap.ticker.fps(60);
gsap.ticker.add(draw);

type Props = ComponentProps<"canvas">;

export default function (props: Props) {
  return (
    <canvas
      ref={(el) => {
        /** set elements */
        canvas = el;
        if (canvas) {
          /** set size */
          canvas.width = 2 * size;
          canvas.height = 2 * size;
          ctx = canvas.getContext("2d");
          if (ctx) {
            /** center draw coords */
            ctx.translate(size, size);
            /** start draw loop */
            draw();
          }
        }
        return () => {
          /** cleanup */
          canvas = null;
          ctx = null;
        };
      }}
      {...props}
    />
  );
}
