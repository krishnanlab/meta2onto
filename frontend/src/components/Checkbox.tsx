import type { ReactNode } from "react";

type Props = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  children: ReactNode;
};

export default function Checkbox({ value, onChange, children }: Props) {
  return (
    <label className="hover:bg-slate-100">
      <input
        className="size-4"
        type="checkbox"
        checked={value}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      {children}
    </label>
  );
}
