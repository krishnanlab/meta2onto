import type { ReactNode } from "react";

type Props = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  children: ReactNode;
};

const Checkbox = ({ value, onChange, children }: Props) => {
  return (
    <label>
      <input
        className="size-4"
        type="checkbox"
        checked={value}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      {children}
    </label>
  );
};

export default Checkbox;
