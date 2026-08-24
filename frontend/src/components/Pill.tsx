import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import Tooltip from "@/components/Tooltip";

type Props = {
  value?: string;
  color?: Record<string, string>;
  tooltip?: Record<string, ReactNode>;
  hollow?: boolean;
} & Omit<ComponentProps<"div">, "color">;

export default function Pill({
  value,
  color,
  className,
  tooltip,
  hollow,
  ...props
}: Props) {
  return (
    <Tooltip content={tooltip?.[value ?? ""] ?? tooltip?.default ?? ""}>
      <span
        className={clsx(
          "inline-flex items-center justify-center gap-1 rounded-full px-2",
          color?.[value ?? ""] ?? color?.default,
          hollow ? "border border-current" : "bg-current",
          className,
        )}
        {...props}
      >
        <span className="truncate text-center text-black">{value}</span>
      </span>
    </Tooltip>
  );
}
