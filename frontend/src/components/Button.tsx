import type { ComponentProps, Ref } from "react";
import clsx from "clsx";
import Link from "@/components/Link";

type Props = Base & (_Link | _Button);

type Base = {
  /** color */
  color?: "none" | "theme" | "accent";
};

type _Link = { ref?: Ref<HTMLAnchorElement> } & Pick<
  ComponentProps<typeof Link>,
  "children" | "to" | "className" | "style"
>;

type _Button = { ref?: Ref<HTMLButtonElement> } & Pick<
  ComponentProps<"button">,
  | "children"
  | "type"
  | "className"
  | "style"
  | "disabled"
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
  color = "theme",
  className,
  children,
  ...props
}: Props) => {
  /** combine styles */
  const _class = clsx(
    className,
    "flex items-center gap-2 rounded p-2 leading-none hover:bg-slate-500/50 hover:text-white",
    color === "none" && "bg-transparent text-current disabled:text-slate-300",
    color === "theme" && "bg-theme text-white disabled:bg-slate-300",
    color === "accent" && "bg-accent text-white disabled:bg-slate-300",
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
