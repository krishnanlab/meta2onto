import type { ComponentProps, Ref } from "react";
import clsx from "clsx";
import Link from "@/components/Link";

type Props = Base & (_Link | _Button);

type Base = {
  /** color */
  color?: "none" | "theme" | "accent";
};

type _Link = { ref?: Ref<HTMLAnchorElement> } & Omit<
  ComponentProps<typeof Link>,
  "onClick"
>;

type _Button = {
  ref?: Ref<HTMLButtonElement>;
} & ComponentProps<"button">;

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
      hover:bg-slate-800 hover:text-white
    `,
    color === "none" && "bg-transparent text-theme",
    color === "theme" && "bg-theme text-white",
    color === "accent" && "bg-accent text-white",
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
