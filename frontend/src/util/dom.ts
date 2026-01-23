import type { ReactNode } from "react";
import { deepMap, onlyText } from "react-children-utilities";
import { pick } from "lodash";
import { waitFor } from "@/util/misc";

export type Theme = Record<`--${string}`, string>;

/** get all css variables on root */
export const getTheme = (): Theme => {
  const styles = window.getComputedStyle(document.documentElement);
  const vars = Object.values(
    window.getComputedStyle(document.documentElement),
  ).filter((value) => value.startsWith("--"));
  return Object.fromEntries(
    vars.map((key) => [key, styles.getPropertyValue(key).trim()]),
  );
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

/** scroll to element */
export const scrollTo = async (
  element: Element | null | undefined,
  options: ScrollIntoViewOptions = { behavior: "smooth" },
) => {
  if (!element) return;
  /** scroll to element */
  elementOrSection(element).scrollIntoView(options);
};

/** check if css selector is valid */
const validSelector = (selector: unknown) => {
  if (typeof selector !== "string") return false;
  try {
    document.querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
};

/** scroll to element by selector */
export const scrollToSelector = async (
  selector: string,
  options: ScrollIntoViewOptions = { behavior: "smooth" },
) => {
  if (!validSelector(selector)) return;
  if (!selector) return;

  /** wait for element to appear */
  const element = await waitFor(() => document.querySelector(selector));
  if (!element) return;

  /** scroll to element */
  scrollTo(element, options);
};

/** if element is first child of section, change element to section itself */
const elementOrSection = <El extends Element>(element: El) => {
  const section = element.closest("section");
  return section &&
    element.matches("section > :first-child, section > :first-child *")
    ? section
    : element;
};

/** glow element */
export const glow = (element: Element) =>
  elementOrSection(element).animate(
    [
      { boxShadow: "inset 0 0 40px var(--color-accent)", offset: 0 },
      { boxShadow: "inset 0 0 40px transparent", offset: 1 },
    ],
    { duration: 2000 },
  );

/** fly one element to another */
export const fly = async (source: HTMLElement, target: HTMLElement) => {
  /** get element sizes */
  const sourceBox = source.getBoundingClientRect();
  const targetBox = target.getBoundingClientRect();

  if (sourceBox.width === 0 || sourceBox.height === 0) return;
  if (targetBox.width === 0 || targetBox.height === 0) return;

  /** get element styles */
  // eslint-disable-next-line
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
    { duration: 300, easing: "ease-in" },
  ).finished;
  /** highlight target */
  const ring = {
    outlineStyle: "solid",
    outlineWidth: "2px",
    outlineOffset: "2px",
  };
  await target.animate(
    [
      { outlineColor: "transparent", ...ring, easing: "ease-out" },
      { outlineColor: targetStyle.backgroundColor, ...ring, easing: "ease-in" },
      { outlineColor: "transparent", ...ring },
    ],
    { duration: 500, easing: "ease-in-out" },
  ).finished;

  /** cleanup */
  flyer.remove();
};
