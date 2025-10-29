import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  value: number;
  min?: number;
  max?: number;
};

export default function ({ children, value, min = 0, max = 1 }: Props) {
  return (
    <label
      className="flex gap-1! rounded px-1"
      style={{
        backgroundColor: `color-mix(in hsl, transparent, #10b981 ${50 * value}%)`,
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
