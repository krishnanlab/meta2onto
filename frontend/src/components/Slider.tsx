import type { ReactNode } from "react";
import type { SliderRootProps } from "@base-ui/react";
import { useState } from "react";
import { Slider as _Slider } from "@base-ui/react";
import clsx from "clsx";
import { clamp, isEqual, range } from "lodash";

type Props = {
  value: number[];
  onInput?: (values: number[]) => void;
  onChange?: (values: number[]) => void;
  label: (values: readonly number[]) => ReactNode;
  thumbLabel: string[];
  className?: string;
} & Omit<SliderRootProps, "value" | "onChange" | "className">;

export default function Slider({
  value,
  onInput,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  thumbLabel,
  className,
  ...props
}: Props) {
  /** local controlled state */
  const [values, setValues] = useState(value);

  /** re-clamp values to within possibly new min/max */
  const clamped = values.map((value) => clamp(value, min, max));
  if (!isEqual(clamped, values)) setValues(clamped);

  return (
    <_Slider.Root
      value={values}
      onValueChange={(values) => {
        const _values = [values].flat();
        setValues(_values);
        onInput?.(_values);
      }}
      onValueCommitted={(values) => onChange?.([values].flat())}
      min={min}
      max={max}
      step={step}
      className={clsx("flex flex-col gap-2", className)}
      {...props}
    >
      <_Slider.Value>{(_, values) => label(values)}</_Slider.Value>
      <_Slider.Control
        className="
          flex cursor-pointer touch-none items-center p-2 text-theme
          transition-colors select-none
          hover:text-slate-800
        "
      >
        <_Slider.Track className="h-1 w-full rounded-full bg-slate-300">
          <_Slider.Indicator className="rounded-full bg-current" />
          {range(values.length).map((index) => (
            <_Slider.Thumb
              key={index}
              index={index}
              className="size-4 rounded-full bg-current"
              aria-label={[thumbLabel].flat()[index]}
            />
          ))}
        </_Slider.Track>
      </_Slider.Control>
    </_Slider.Root>
  );
}
