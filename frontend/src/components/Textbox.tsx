import type { ComponentPropsWithRef } from "react";
import clsx from "clsx";

type Props = {
  onChange?: (value: string) => void;
} & Omit<ComponentPropsWithRef<"input">, "onChange">;

export default function ({ className, onChange, ...props }: Props) {
  return (
    <input
      className={clsx(
        "rounded border border-slate-300 p-2 leading-none disabled:border-0 disabled:bg-slate-200!",
        className,
      )}
      onChange={(event) => onChange?.(event.currentTarget.value)}
      {...props}
    />
  );
}
