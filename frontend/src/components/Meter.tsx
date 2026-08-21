import type { ComponentProps } from "react";

type Props = {
  value: number;
  min?: number;
  max?: number;
} & ComponentProps<"div">;

export default function Meter({ value, min = 0, max = 1, ...props }: Props) {
  return (
    <label className="contents">
      <div
        {...props}
        tabIndex={0}
        className="grid size-12 shrink-0 place-items-center rounded-full"
        style={{
          backgroundColor: `color-mix(in hsl, transparent, var(--color-theme) ${10 * value ** 2}%)`,
        }}
      >
        <span>{(100 * value).toFixed(0)}%</span>
      </div>
      <meter className="sr-only" {...{ value, min, max }} />
    </label>
  );
}
