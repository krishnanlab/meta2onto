import type { JSX, ReactNode } from "react";
import { useRef } from "react";
import Link from "@/components/Link";
import { renderText } from "@/util/dom";
import { slugify } from "@/util/string";

type Props = {
  /** "indent" level */
  level: 1 | 2 | 3 | 4;
  /** manually set anchor link instead of automatically from children text */
  id?: string;
  /** class on heading */
  className?: string;
  /** heading content */
  children: ReactNode;
};

/**
 * demarcates a new section/level of content. only use one level 1 per page.
 * don't use levels below 4.
 */
function Heading({ level, id: explicitId, className, children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  /** heading tag */
  const Tag: keyof JSX.IntrinsicElements = `h${level}`;

  /** url-compatible, "slugified" id */
  const id = explicitId ?? slugify(renderText(children));

  return (
    <Tag id={id} ref={ref} className={className}>
      <Link to={"#" + id} className="contents! text-current no-underline">
        {children}
      </Link>
    </Tag>
  );
}

export function H1(props: Omit<Props, "level">) {
  return <Heading level={1} {...props} />;
}

export function H2(props: Omit<Props, "level">) {
  return <Heading level={2} {...props} />;
}

export function H3(props: Omit<Props, "level">) {
  return <Heading level={3} {...props} />;
}

export function H4(props: Omit<Props, "level">) {
  return <Heading level={4} {...props} />;
}
