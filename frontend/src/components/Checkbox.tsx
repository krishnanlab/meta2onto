import type { ReactNode } from "react";

type Props = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  children: ReactNode;
};

export default function ({ value, onChange, children }: Props) {
  return (
    <label>
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
