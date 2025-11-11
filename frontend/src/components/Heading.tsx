import { useRef } from "react";
import type { JSX, ReactNode } from "react";
import clsx from "clsx";
import { Hash } from "lucide-react";
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
export default function Component({
  level,
  anchor,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  /** heading tag */
  const Tag: keyof JSX.IntrinsicElements = `h${level}`;

  /** url-compatible, "slugified" id */
  const id = anchor ?? slugify(renderText(children));

  return (
    <Tag id={id} ref={ref} className={clsx("group", className)}>
      {/* content */}
      {children}

      {/* link to section */}
      {id && level !== 1 && (
        <Link
          to={"#" + id}
          className="-ml-2 size-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Heading link"
        >
          <Hash className="translate-x-2" />
        </Link>
      )}
    </Tag>
  );
}
