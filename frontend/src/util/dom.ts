import type { ReactNode } from "react";
import { deepMap, onlyText } from "react-children-utilities";
import { waitFor } from "@/util/misc";

/** scroll to element, optionally by selector */
export const scrollTo = async (
  selector?: string | Element | null,
  options: ScrollIntoViewOptions = { behavior: "smooth" },
) => {
  if (!selector) return;

  /** wait for element to appear */
  const element =
    typeof selector === "string"
      ? await waitFor(() => document.querySelector(selector))
      : selector;
  if (!element) return;

  /** scroll to element */
  elementOrSection(element).scrollIntoView(options);
};

/** get text content of react node */
export const renderText = (node: ReactNode) =>
  /** map all children to text */
  deepMap(node, (node) => ` ${onlyText(node)} `)
    .join("")
    /** collapse spaces */
    .replaceAll(/\s+/g, " ")
    .trim();
/**
 * can't use renderToString because doesn't have access to contexts app needs
 * (e.g. router), throwing many errors. impractical to work around (have to
 * provide or fake all contexts).
 *
 * https://react.dev/reference/react-dom/server/renderToString#removing-rendertostring-from-the-client-code
 *
 * alternative react suggests (createRoot, flushSync, root.render) completely
 * impractical. has same context issue, and also can't be called during
 * render/lifecycle (could be worked around by making it async, but then using
 * this function in situ becomes much more of pain).
 */

/** get coordinates of element relative to document */
export const getDocBbox = (element: Element) => {
  const { left, top, right, bottom } = element.getBoundingClientRect();
  return {
    top: top + window.scrollY,
    bottom: bottom + window.scrollY,
    left: left + window.scrollX,
    right: right + window.scrollX,
  };
};

/** glow element */
export const glow = (element: Element) => {
  const target = elementOrSection(element);
  const original = window.getComputedStyle(target).backgroundColor;
  target.animate(
    [
      { backgroundColor: "var(--color-light)", offset: 0 },
      { backgroundColor: original, offset: 1 },
    ],
    { duration: 2000 },
  );
};

/** if element is first child of section, change element to section itself */
export const elementOrSection = <El extends Element>(element: El) => {
  const parent = element.parentElement;
  return parent && element.matches("section > :first-child")
    ? (parent as HTMLElement)
    : element;
};
