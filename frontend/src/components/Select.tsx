import type { ComponentProps } from "react";
import { startCase } from "lodash";

type Props<O extends Option> = {
  /** pass with "as const" */
  options: readonly O[];
  /** selected option state */
  value?: O["value"];
  /** on selected option state change */
  onChange?: (value: O["value"]) => void;
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export type Option<Value = string> = {
  value: Value;
  name?: string;
};

export default function Select<O extends Option>({
  value,
  onChange,
  options,
  ...props
}: Props<O>) {
  return (
    <select
      className="rounded-sm border border-slate-300 px-2 py-1"
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name ?? startCase(option.value)}
        </option>
      ))}
    </select>
  );
}
