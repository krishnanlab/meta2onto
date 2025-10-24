import type { ComponentPropsWithRef } from "react";
import clsx from "clsx";

type Props = ComponentPropsWithRef<"input">;

const Textbox = ({ className, ...props }: Props) => {
  return (
    <input
      className={clsx(
        "border-theme-light rounded border-1 p-2 leading-none disabled:border-0 disabled:bg-slate-200!",
        className,
      )}
      {...props}
    />
  );
};

export default Textbox;
