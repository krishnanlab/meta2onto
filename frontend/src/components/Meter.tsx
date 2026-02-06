import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  value: number;
  min?: number;
  max?: number;
};

export default function Meter({ children, value, min = 0, max = 1 }: Props) {
  return (
    <label
      className="flex gap-1! rounded-sm px-1"
      style={{
        backgroundColor: `color-mix(in hsl, transparent, var(--color-highlight) ${50 * value ** 2}%)`,
      }}
    >
      {children}
      <span>{(100 * value).toFixed(0)}%</span>
      <meter className="sr-only" {...{ value, min, max }}>
        {children}
      </meter>
    </label>
  );
}
