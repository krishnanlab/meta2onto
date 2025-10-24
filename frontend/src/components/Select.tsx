import type { ComponentProps } from "react";

type Props<O extends Option> = {
  /** pass with "as const" */
  options: readonly O[];
  /** selected option state */
  value?: O["id"];
  /** on selected option state change */
  onChange?: (value: O["id"]) => void;
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export type Option<ID = string> = {
  id: ID;
  value: string;
};

const Select = <O extends Option>({
  value,
  onChange,
  options,
  ...props
}: Props<O>) => {
  return (
    <select
      className="border-theme-light rounded border-1 px-2 py-1"
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value as O["id"])}
      {...props}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.value}
        </option>
      ))}
    </select>
  );
};

export default Select;
