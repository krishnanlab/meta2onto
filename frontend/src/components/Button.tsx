import type { ComponentProps, ReactNode, Ref } from "react";
import clsx from "clsx";
import Link from "@/components/Link";

type Props = Base & (_Link | _Button);

type Base = {
  /** fill */
  fill?: "solid" | "hollow";
  /** color */
  color?: "none" | "primary" | "secondary" | "critical";
  /** class on button */
  className?: string;
  /** content */
  children: ReactNode;
};

type _Link = { ref?: Ref<HTMLAnchorElement> } & Pick<
  ComponentProps<typeof Link>,
  "to" | "style"
>;

type _Button = { ref?: Ref<HTMLButtonElement> } & Pick<
  ComponentProps<"button">,
  | "type"
  | "style"
  | "onClick"
  | "onDrag"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
>;

/**
 * looks like a button and either goes somewhere (link) or does something
 * (button)
 */
const Button = ({
  ref,
  color = "none",
  className,
  children,
  ...props
}: Props) => {
  /** combine styles */
  const _class = clsx(
    className,
    "flex items-center gap-2 rounded p-2 leading-none hover:bg-slate-500 hover:text-white",
    color === "none" && "text-secondary bg-transparent",
    color === "primary" && "bg-primary text-white",
    color === "secondary" && "bg-secondary text-white",
    color === "critical" && "bg-black text-white",
  );

  /** if "to", render as link */
  if ("to" in props)
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        className={_class}
        showArrow={false}
        {...props}
      >
        {children}
      </Link>
    );
  /** otherwise, render as button */ else
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={_class}
        type="button"
        {...props}
      >
        {children}
      </button>
    );
};

export default Button;
