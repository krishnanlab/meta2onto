import Pill from "@/components/Pill";

type Props = {
  children: string;
  value: number;
  min?: number;
  max?: number;
};

export default function Meter({ children, value, min = 0, max = 1 }: Props) {
  return (
    <label className="contents">
      <Pill
        style={{
          backgroundColor: `color-mix(in hsl, transparent, var(--color-indigo-500) ${50 * value ** 2}%)`,
        }}
      >
        {children}
        <span>{(100 * value).toFixed(0)}%</span>
      </Pill>
      <meter className="sr-only" {...{ value, min, max }}>
        {children}
      </meter>
    </label>
  );
}
