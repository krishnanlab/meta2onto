import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import Tooltip from "@/components/Tooltip";

type Props = {
  value?: string;
  color?: Record<string, string>;
  tooltip?: Record<string, ReactNode>;
} & Omit<ComponentProps<"div">, "color">;

export default function Pill({
  value,
  color,
  className,
  tooltip,
  children,
  ...props
}: Props) {
  return (
    <Tooltip content={tooltip?.[value ?? ""] ?? tooltip?.default ?? ""}>
      <span
        className={clsx(
          `inline-flex items-center justify-center gap-1 rounded-full px-2`,
          color?.[value ?? ""] ?? color?.default ?? "bg-theme-light text-black",
          className,
        )}
        {...props}
      >
        {children}
        <span className="truncate text-center">{value}</span>
      </span>
    </Tooltip>
  );
}
