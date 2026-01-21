import { useEffect, useRef, useState } from "react";
import { useElementSize, useWindowScroll } from "@reactuses/core";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { Menu, ShoppingCart, X } from "lucide-react";
import { cartAtom } from "@/cart";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import Tooltip from "@/components/Tooltip";

const { VITE_TITLE: title } = import.meta.env;

let cartRef: HTMLAnchorElement | undefined;
let toggleRef: HTMLButtonElement | undefined;

export const getCartRef = () =>
  cartRef && cartRef.getBoundingClientRect().width ? cartRef : toggleRef;

export default function Header() {
  /** cart state */
  const cart = useAtomValue(cartAtom);

  const { y } = useWindowScroll();
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
      className={clsx(
        `
          sticky top-0 z-10 flex flex-row flex-wrap items-center justify-between
          bg-theme-dark text-white
        `,
        y > 0 ? "gap-2 p-2" : "gap-4 p-4",
      )}
    >
      {/* title */}
      <a
        href="/"
        className="
          flex items-center gap-2 text-2xl tracking-wider text-white!
          hover:text-slate-300!
        "
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
          className="
            text-current!
            sm:hidden
          "
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
          `
            flex flex-wrap items-center justify-center gap-4 text-xl
            max-xs:flex-col
          `,
          !open && "max-sm:hidden",
          open && "max-sm:w-full",
        )}
      >
        <Button to="/about" color="none" className="text-current!">
          About
        </Button>
        <Button to="/search" color="none" className="text-current!">
          Search
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
            <div
              className="
                absolute -top-2 -right-2 grid size-5 place-items-center
                rounded-full bg-theme-light text-sm leading-none text-black
              "
            >
              {cart.studies.length}
            </div>
          )}
        </Button>
      </nav>
    </header>
  );
}
