import type { ReactNode } from "react";
import { deepMap, onlyText } from "react-children-utilities";
import { pick } from "lodash";
import { waitFor } from "@/util/misc";

export type Theme = Record<`--${string}`, string>;

/** https://stackoverflow.com/a/78994961/2180570 */
export const getTheme = (): Theme => {
  const styles = window.getComputedStyle(document.documentElement);
  const vars = Object.values(
    window.getComputedStyle(document.documentElement),
  ).filter((value) => value.startsWith("--"));
  return Object.fromEntries(
    vars.map((key) => [key, styles.getPropertyValue(key).trim()]),
  );
};

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
  const bbox = {
    top: top + window.scrollY,
    bottom: bottom + window.scrollY,
    left: left + window.scrollX,
    right: right + window.scrollX,
  };
  return {
    ...bbox,
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    x: (bbox.left + bbox.right) / 2,
    y: (bbox.top + bbox.bottom) / 2,
  };
};

/** glow element */
export const glow = (element: Element) => {
  const target = elementOrSection(element);
  const original = window.getComputedStyle(target).backgroundColor;
  target.animate(
    [
      { backgroundColor: "var(--color-theme-light)", offset: 0 },
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

/** fly one element to another */
export const flyElement = async (
  source?: HTMLElement,
  target?: HTMLElement,
) => {
  if (!source || !target) return;

  /** get element props */
  const sourceBox = source.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();
  const styles = ["color", "borderRadius", "backgroundColor"];
  const sourceStyle = pick(window.getComputedStyle(source), styles) as Keyframe;
  const targetStyle = pick(window.getComputedStyle(target), styles) as Keyframe;

  /** create new element to fly */
  const flyer = document.createElement("div");
  flyer.style.position = "fixed";
  flyer.style.pointerEvents = "none";
  flyer.style.zIndex = "999";
  flyer.style.translate = "-50% -50%";
  document.body.append(flyer);

  /** fly */
  await flyer.animate(
    [
      {
        ...sourceStyle,
        left: `${sourceBox.left + sourceBox.width / 2}px`,
        top: `${sourceBox.top + sourceBox.height / 2}px`,
        width: `${sourceBox.width}px`,
        height: `${sourceBox.height}px`,
      },
      {
        ...targetStyle,
        left: `${targetBox.left + targetBox.width / 2}px`,
        top: `${targetBox.top + targetBox.height / 2}px`,
        width: `${targetBox.width}px`,
        height: `${targetBox.height}px`,
      },
    ],
    { duration: 300, easing: "ease-in-out" },
  ).finished;
  /** highlight target */
  const ring = {
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineOffset: "2px",
  };
  await target.animate(
    [
      { outlineColor: "transparent", ...ring },
      { outlineColor: targetStyle.backgroundColor, ...ring },
      { outlineColor: "transparent", ...ring },
    ],
    { duration: 500, easing: "ease-in-out" },
  ).finished;

  /** cleanup */
  flyer.remove();
};
