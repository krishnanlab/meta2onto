import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import Tooltip from "@/components/Tooltip";

type Props = {
  value?: string;
  map?: Record<string, string>;
  tooltip?: ReactNode;
} & ComponentProps<"div">;

export default function Pill({
  value,
  map,
  className,
  tooltip,
  children,
  ...props
}: Props) {
  return (
    <Tooltip content={tooltip}>
      <span
        className={clsx(
          `inline-flex items-center justify-center gap-1 rounded-full px-2`,
          map?.[value ?? ""] ?? map?.default ?? "bg-theme-light text-black",
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
