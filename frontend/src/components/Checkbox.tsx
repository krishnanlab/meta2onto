import type { ReactNode } from "react";

type Props = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  children: ReactNode;
};

export default function Checkbox({ value, onChange, children }: Props) {
  return (
    <label
      className="
        p-1
        hover:bg-slate-100
      "
    >
      <input
        className="size-4 shrink-0"
        type="checkbox"
        checked={value}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      {children}
    </label>
  );
}
