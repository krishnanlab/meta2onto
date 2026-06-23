import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import Tooltip from "@/components/Tooltip";

type Props = {
  value?: string;
  color?: string | Record<string, string>;
  tooltip?: Exclude<ReactNode, object> | Record<string, ReactNode>;
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
    <Tooltip
      content={
        typeof tooltip === "object"
          ? (tooltip?.[value ?? ""] ?? tooltip?.default ?? "")
          : tooltip
      }
    >
      <span
        className={clsx(
          `inline-flex items-center justify-center gap-1 rounded-full px-2`,
          typeof color === "object"
            ? (color?.[value ?? ""] ??
                color?.default ??
                "bg-theme-light text-black")
            : color,
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
