import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import { Radio } from "@base-ui-components/react/radio";
import { RadioGroup } from "@base-ui-components/react/radio-group";
import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";

type Props<O extends Option> = {
  /** label content */
  label: ReactNode;
  /** pass with "as const" */
  options: readonly O[];
  /** selected option state */
  value?: O["value"];
  /** on selected option state change */
  onChange?: (value: O["value"]) => void;
  /** class on container */
  className?: string;
};

export type Option<Value = string> = {
  value: Value;
  render: ReactElement<Record<string, unknown>>;
};

export default function <O extends Option>({
  label,
  options,
  value,
  onChange,
  className,
}: Props<O>) {
  const id = useId();

  return (
    <RadioGroup
      value={value}
      onValueChange={(value) => onChange?.(value as O["value"])}
      aria-labelledby={id}
      className={clsx("flex flex-col gap-2", className)}
    >
      <div id={id}>{label}</div>

      <div className="flex gap-2 overflow-x-auto">
        {options.map((option, index) => (
          <label
            ref={(el) => {
              if (option.value === value) el?.scrollIntoView(true);
            }}
            key={index}
            className="border-theme-light relative flex min-w-50 flex-1 cursor-pointer flex-col items-start! gap-2 rounded border p-2 transition-colors hover:bg-slate-100"
          >
            <Radio.Root
              value={option.value}
              render={option.render}
              /** related: https://github.com/mui/material-ui/issues/43106 */
              nativeButton={false}
            />
            {option.value === value && (
              <CheckCircle2 className="absolute top-2 right-2 text-xl text-green-500" />
            )}
          </label>
        ))}
      </div>
    </RadioGroup>
  );
}
