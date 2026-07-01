import { useEffect, useRef, useState } from "react";
import { useElementSize } from "@reactuses/core";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Menu, ShoppingCart, X } from "lucide-react";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import Tooltip from "@/components/Tooltip";
import { cartAtom } from "@/state/cart";
import { formatNumber } from "@/util/string";

const { VITE_TITLE: title } = import.meta.env;

let cartRef: HTMLAnchorElement | undefined;
let toggleRef: HTMLButtonElement | undefined;

export const getCartRef = () =>
  cartRef && cartRef.getBoundingClientRect().width ? cartRef : toggleRef;

export default function Header() {
  /** cart state */
  const cart = useAtomValue(cartAtom);

  /** nav menu expanded/collapsed state */
  const [open, setOpen] = useState(false);

  /** header height */
  const ref = useRef<HTMLElement | null>(null);
  let [, height] = useElementSize(ref, { box: "border-box" });
  height = Math.round(height);

  useEffect(() => {
    /** make sure all scrolls take into account header height */
    document.documentElement.style.scrollPaddingTop = height + "px";
  }, [height]);

  return (
    <header
      ref={ref}
      className="sticky top-0 z-10 flex flex-row flex-wrap items-center justify-between gap-4 bg-theme-dark p-4"
    >
      {/* title */}
      <a
        href="/"
        className="flex items-center gap-2 rounded-md text-2xl tracking-wider text-white no-underline"
      >
        <Logo color="currentColor" className="h-8" />
        {title}
      </a>

      {/* nav toggle */}
      <Tooltip content={open ? "Collapse menu" : "Expand menu"}>
        <Button
          ref={(el: HTMLButtonElement) => {
            toggleRef = el;
            return () => (toggleRef = undefined);
          }}
          color="none"
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="nav"
        >
          {open ? <X /> : <Menu />}
        </Button>
      </Tooltip>

      {/* nav bar */}
      <nav
        className={clsx(
          `flex flex-wrap items-center justify-center gap-4 text-xl *:text-white max-xs:flex-col`,
          !open && "max-md:hidden",
          open && "max-md:w-full",
        )}
      >
        <Button to="/" color="none">
          Search
        </Button>
        <Button to="/about" color="none">
          About
        </Button>
        <Button to="/help" color="none">
          Help
        </Button>
        <Button
          ref={(el: HTMLAnchorElement) => {
            cartRef = el;
            return () => (cartRef = undefined);
          }}
          to="/cart"
          color="accent"
          aria-label="Data cart"
          className="relative"
        >
          <ShoppingCart />
          Cart
          {!!cart.studies.length && (
            <div className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-theme-light text-sm text-black">
              {formatNumber(cart.studies.length)}
            </div>
          )}
        </Button>
      </nav>
    </header>
  );
}
