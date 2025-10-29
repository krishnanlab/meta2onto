import type { ComponentProps } from "react";
import { Link as RouterLink } from "react-router";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";

type Props = Base & (_Anchor | _Router);

type Base = {
  /** force link opening in new/same tab */
  newTab?: boolean;
  /** force showing/hiding arrow icon */
  showArrow?: boolean;
};

type _Anchor = ComponentProps<"a"> & { to: string };
type _Router = ComponentProps<typeof RouterLink>;

/** link to internal route or external url */
export default function ({
  ref,
  to,
  children,
  newTab,
  showArrow,
  className,
  ...props
}: Props) {
  /** whether link is external (some other site) or internal (within router) */
  const external = typeof to === "string" && to.match(/^(http|mailto)/);

  /** whether to open link in new tab */
  const target = (newTab ?? external) ? "_blank" : "";

  /** whether to show arrow icon */
  const _showArrow = showArrow ?? target;

  /** combine styles */
  const _class = clsx(
    className,
    "text-theme inline-flex items-center gap-1 hover:text-current",
  );

  /** full element to render */
  const element = external ? (
    /** "external" plain link */
    <a ref={ref} href={to} target={target} className={_class} {...props}>
      {children}
      {_showArrow && <ExternalLink />}
    </a>
  ) : (
    /** "internal" router link */
    <RouterLink ref={ref} to={to} target={target} className={_class} {...props}>
      {children}
      {_showArrow && <ExternalLink />}
    </RouterLink>
  );

  return element;
}
