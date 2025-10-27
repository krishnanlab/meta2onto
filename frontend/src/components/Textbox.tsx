import type { ComponentPropsWithRef } from "react";
import clsx from "clsx";

type Props = {
  onChange?: (value: string) => void;
} & Omit<ComponentPropsWithRef<"input">, "onChange">;

const Textbox = ({ className, onChange, ...props }: Props) => {
  return (
    <input
      className={clsx(
        "border-theme-light rounded border-1 p-2 leading-none disabled:border-0 disabled:bg-slate-200!",
        className,
      )}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      {...props}
    />
  );
};

export default Textbox;
