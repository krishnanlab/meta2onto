import { useRef } from "react";
import type { JSX, ReactNode } from "react";
import clsx from "clsx";
import Link from "@/components/Link";
import { renderText } from "@/util/dom";
import { slugify } from "@/util/string";

type Props = {
  /** "indent" level */
  level: 1 | 2 | 3 | 4;
  /** manually set anchor link instead of automatically from children text */
  anchor?: string;
  /** class on heading */
  className?: string;
  /** heading content */
  children: ReactNode;
};

/**
 * demarcates a new section/level of content. only use one level 1 per page.
 * don't use levels below 4.
 */
export default function Heading({ level, anchor, className, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  /** heading tag */
  const Tag: keyof JSX.IntrinsicElements = `h${level}`;

  /** url-compatible, "slugified" id */
  const id = anchor ?? slugify(renderText(children));

  return (
    <Link to={"#" + id} className={clsx("group", className)}>
      <Tag
        id={id}
        ref={ref}
        className="
          transition-colors
          group-hover:text-accent
        "
      >
        {children}
      </Tag>
    </Link>
  );
}
