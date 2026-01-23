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
  | "onClick"
  | "onDrag"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "aria-disabled"
>;

/**
 * looks like a button and either goes somewhere (link) or does something
 * (button)
 */
export default function Button({
  ref,
  color = "theme",
  className,
  children,
  ...props
}: Props) {
  /** combine styles */
  const _class = clsx(
    className,
    `
      flex items-center justify-center gap-2 rounded-sm p-2
      hover:bg-slate-500 hover:text-white
    `,
    color === "none" &&
      `
        bg-transparent text-theme
        disabled:text-slate-300
      `,
    color === "theme" &&
      `
        bg-theme text-white
        disabled:bg-slate-300
      `,
    color === "accent" &&
      `
        bg-accent text-white
        disabled:bg-slate-300
      `,
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
  else {
    /** otherwise, render as button */
    const { onClick, ...rest } = props;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        className={_class}
        onClick={(...args) => {
          if (!rest["aria-disabled"]) onClick?.(...args);
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }
}
